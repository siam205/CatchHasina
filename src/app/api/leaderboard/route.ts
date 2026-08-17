import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEVEL_CONFIGS } from "@/game/levels/levelConfig";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const levelNumber = Number(new URL(request.url).searchParams.get("level") ?? "1");
  if (!LEVEL_CONFIGS.some((level) => level.level === levelNumber)) return NextResponse.json({ error: "Unknown level." }, { status: 400 });

  try {
    const entries = await prisma.bestScore.findMany({
      where: { level: levelNumber },
      orderBy: [{ score: "desc" }, { remainingTimeSeconds: "desc" }, { collisionsUsed: "asc" }, { updatedAt: "asc" }],
      take: 25,
      include: { user: { select: { id: true, username: true } } },
    });
    const userId = await getSessionUserId();
    return NextResponse.json({
      entries: entries.map((entry, index) => ({
        rank: index + 1,
        username: entry.user.username,
        score: entry.score,
        collectiblesCollected: entry.collectiblesCollected,
        collisionsUsed: entry.collisionsUsed,
        remainingTimeSeconds: entry.remainingTimeSeconds,
        isCurrentUser: entry.user.id === userId,
      })),
    });
  } catch (error) {
    console.error("Leaderboard lookup failed", error);
    return NextResponse.json({ entries: [], error: "Leaderboard is unavailable until the database is configured." }, { status: 200 });
  }
}
