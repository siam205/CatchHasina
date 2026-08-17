import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEVEL_CONFIGS } from "@/game/levels/levelConfig";
import { ScoreSystem } from "@/game/engine/ScoreSystem";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Sign in to submit leaderboard scores." }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const levelNumber = toInteger(body.level);
    const collectiblesCollected = toInteger(body.collectiblesCollected);
    const collisionsUsed = toInteger(body.collisionsUsed);
    const remainingTimeSeconds = toInteger(body.remainingTimeSeconds);
    const level = LEVEL_CONFIGS.find((candidate) => candidate.level === levelNumber);
    if (!level || levelNumber === null || collectiblesCollected === null || collisionsUsed === null || remainingTimeSeconds === null) {
      return NextResponse.json({ error: "Invalid level result." }, { status: 400 });
    }
    if (collectiblesCollected < 0 || collectiblesCollected > level.collectibles.length || collisionsUsed < 0 || collisionsUsed >= level.maxCollisions || remainingTimeSeconds < 0 || remainingTimeSeconds > level.timeLimitSeconds) {
      return NextResponse.json({ error: "Level result is outside the allowed range." }, { status: 400 });
    }

    const scoreSystem = new ScoreSystem();
    const collectiblePoints = level.collectibles.slice(0, collectiblesCollected).reduce(
      (total, collectible) => total + scoreSystem.collectiblePoints(collectible.value, level.difficultyMultiplier),
      0,
    );
    const score = scoreSystem.completionPoints(level.difficultyMultiplier) + collectiblePoints;
    const existing = await prisma.bestScore.findUnique({ where: { userId_level: { userId, level: levelNumber } } });
    if (existing && existing.score >= score) return NextResponse.json({ score: existing, improved: false });

    const savedScore = await prisma.bestScore.upsert({
      where: { userId_level: { userId, level: levelNumber } },
      create: { userId, level: levelNumber, score, collectiblesCollected, totalCollectibles: level.collectibles.length, collisionsUsed, remainingTimeSeconds },
      update: { score, collectiblesCollected, totalCollectibles: level.collectibles.length, collisionsUsed, remainingTimeSeconds },
    });
    return NextResponse.json({ score: savedScore, improved: true });
  } catch (error) {
    console.error("Score submission failed", error);
    return NextResponse.json({ error: "Score submission is unavailable until the database is configured." }, { status: 500 });
  }
}

function toInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}
