import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAchievementKey } from "@/storage/localStorageAdapter";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ achievements: [] });

  try {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "asc" },
    });
    return NextResponse.json({
      achievements: achievements.map((achievement) => ({
        achievementKey: achievement.achievementKey,
        unlockedAt: achievement.unlockedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Achievement lookup failed", error);
    return NextResponse.json({ achievements: [] });
  }
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to sync achievements." }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const keys = Array.isArray(body.achievementKeys) ? body.achievementKeys : [];
    const validKeys = keys.filter((key): key is string => typeof key === "string" && isAchievementKey(key));
    if (validKeys.length === 0) return NextResponse.json({ saved: 0 });

    // An achievement is permanent, so re-submitting one must not move its original unlock date.
    await prisma.userAchievement.createMany({
      data: validKeys.map((achievementKey) => ({ userId, achievementKey })),
      skipDuplicates: true,
    });
    return NextResponse.json({ saved: validKeys.length });
  } catch (error) {
    console.error("Achievement sync failed", error);
    return NextResponse.json({ error: "Achievement sync is unavailable." }, { status: 500 });
  }
}
