import { describe, expect, it } from "vitest";
import { getNewAchievementKeys } from "./AchievementSystem";
import { initialLevel } from "@/game/levels/levelConfig";
import type { GameSnapshot } from "@/game/state/gameTypes";

const completedSnapshot: GameSnapshot = {
  status: "completed",
  level: 1,
  score: 1400,
  collisionsUsed: 0,
  maxCollisions: 8,
  collectiblesCollected: initialLevel.collectibles.length,
  totalCollectibles: initialLevel.collectibles.length,
  remainingTimeSeconds: 80,
  countdownSeconds: 0,
  soundEnabled: true,
  musicEnabled: true,
};

describe("AchievementSystem", () => {
  it("returns first-completion, full-target, and clean-run achievements", () => {
    expect(getNewAchievementKeys({
      snapshot: completedSnapshot,
      level: initialLevel,
      completedLevelCount: 1,
      totalLevelCount: 3,
      existing: {},
    })).toEqual(["firstCompletion", "allTargets", "cleanRun"]);
  });

  it("does not return achievements already stored", () => {
    expect(getNewAchievementKeys({
      snapshot: completedSnapshot,
      level: initialLevel,
      completedLevelCount: 3,
      totalLevelCount: 3,
      existing: {
        firstCompletion: { unlockedAt: "2026-01-01T00:00:00.000Z" },
        allTargets: { unlockedAt: "2026-01-01T00:00:00.000Z" },
        cleanRun: { unlockedAt: "2026-01-01T00:00:00.000Z" },
      },
    })).toEqual(["threeLevels", "allLevels"]);
  });
});
