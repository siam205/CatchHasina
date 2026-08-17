import { describe, expect, it } from "vitest";
import { getNewAchievementKeys } from "@/game/achievements/AchievementSystem";
import { initialLevel } from "@/game/levels/levelConfig";
import { createDefaultProgress, loadProgress, saveProgress } from "@/storage/localStorageAdapter";
import type { GameSnapshot } from "./gameTypes";

describe("progress integration", () => {
  it("persists a completed level and its newly unlocked achievement", () => {
    const snapshot: GameSnapshot = {
      status: "completed",
      level: 1,
      score: 1500,
      collisionsUsed: 0,
      maxCollisions: 8,
      collectiblesCollected: 3,
      totalCollectibles: 3,
      remainingTimeSeconds: 70,
      countdownSeconds: 0,
      soundEnabled: true,
      musicEnabled: false,
    };
    const progress = createDefaultProgress({ soundEnabled: true, musicEnabled: false });
    const newKeys = getNewAchievementKeys({
      snapshot,
      level: initialLevel,
      completedLevelCount: 1,
      totalLevelCount: 3,
      existing: progress.achievements,
    });

    progress.unlockedLevel = 2;
    progress.levelRecords[1] = {
      completions: 1,
      bestScore: snapshot.score,
      bestCollisions: snapshot.collisionsUsed,
      bestCollectibles: snapshot.collectiblesCollected,
      bestRemainingTimeSeconds: snapshot.remainingTimeSeconds,
    };
    for (const key of newKeys) progress.achievements[key] = { unlockedAt: "2026-01-01T00:00:00.000Z" };

    saveProgress(progress);
    const restored = loadProgress();

    expect(restored.unlockedLevel).toBe(2);
    expect(restored.levelRecords[1].bestScore).toBe(1500);
    expect(restored.achievements.firstCompletion).toBeDefined();
    expect(restored.audioSettings.musicEnabled).toBe(false);
  });
});
