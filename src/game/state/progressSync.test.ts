import { describe, expect, it } from "vitest";
import { findUnsyncedAchievementKeys, mergeServerProgress, mergeUnlockedLevel } from "./progressSync";
import { createDefaultProgress } from "@/storage/localStorageAdapter";
import type { PersistedProgress } from "@/storage/storageTypes";
import type { ServerScore } from "@/types/auth";

const TOTAL_LEVELS = 10;

const score = (level: number, overrides: Partial<ServerScore> = {}): ServerScore => ({
  id: `score-${level}`,
  level,
  score: level * 100,
  collectiblesCollected: 3,
  totalCollectibles: 5,
  collisionsUsed: 2,
  remainingTimeSeconds: 40,
  ...overrides,
});

const localProgress = (overrides: Partial<PersistedProgress> = {}): PersistedProgress => ({
  ...createDefaultProgress(),
  ...overrides,
});

describe("mergeUnlockedLevel", () => {
  it("unlocks the level after the highest one cleared on the account", () => {
    expect(mergeUnlockedLevel(4, [score(1), score(2), score(6)], TOTAL_LEVELS)).toBe(7);
  });

  it("never lowers a local unlock that runs ahead of the server", () => {
    expect(mergeUnlockedLevel(9, [score(1), score(2)], TOTAL_LEVELS)).toBe(9);
  });

  it("keeps local progress when the account has no scores", () => {
    expect(mergeUnlockedLevel(5, [], TOTAL_LEVELS)).toBe(5);
  });

  it("clamps to the number of authored levels", () => {
    expect(mergeUnlockedLevel(1, [score(TOTAL_LEVELS)], TOTAL_LEVELS)).toBe(TOTAL_LEVELS);
    expect(mergeUnlockedLevel(999, [], TOTAL_LEVELS)).toBe(TOTAL_LEVELS);
  });

  it("ignores malformed level numbers", () => {
    expect(mergeUnlockedLevel(3, [score(1.5), score(-2), score(0)], TOTAL_LEVELS)).toBe(3);
  });
});

describe("mergeServerProgress", () => {
  it("restores unlocked levels on a browser that lost its local progress", () => {
    const fresh = localProgress();
    const merged = mergeServerProgress(fresh, [score(1), score(2), score(3), score(4), score(5), score(6)], TOTAL_LEVELS);

    expect(merged.unlockedLevel).toBe(7);
    expect(Object.keys(merged.levelRecords)).toHaveLength(6);
    expect(merged.levelRecords[6].bestScore).toBe(600);
  });

  it("keeps the better of each stat when both sides know a level", () => {
    const local = localProgress({
      unlockedLevel: 3,
      levelRecords: {
        2: { completions: 4, bestScore: 900, bestCollisions: 1, bestCollectibles: 5, bestRemainingTimeSeconds: 70 },
      },
    });
    const merged = mergeServerProgress(local, [score(2, { score: 500, collisionsUsed: 0, remainingTimeSeconds: 20 })], TOTAL_LEVELS);

    expect(merged.levelRecords[2]).toEqual({
      completions: 4,
      bestScore: 900,
      bestCollisions: 0,
      bestCollectibles: 5,
      bestRemainingTimeSeconds: 70,
    });
  });

  it("leaves local progress untouched when the account has nothing", () => {
    const local = localProgress({
      unlockedLevel: 4,
      levelRecords: {
        1: { completions: 1, bestScore: 100, bestCollisions: 1, bestCollectibles: 2, bestRemainingTimeSeconds: 10 },
      },
    });

    expect(mergeServerProgress(local, [], TOTAL_LEVELS)).toEqual(local);
  });

  it("preserves audio settings across the merge", () => {
    const local = localProgress({ audioSettings: { soundEnabled: false, musicEnabled: false } });
    const merged = mergeServerProgress(local, [score(1)], TOTAL_LEVELS);

    expect(merged.audioSettings).toEqual({ soundEnabled: false, musicEnabled: false });
  });

  it("adopts server achievements and keeps the earliest unlock date", () => {
    const local = localProgress({ achievements: { firstCompletion: { unlockedAt: "2026-08-10T00:00:00.000Z" } } });
    const merged = mergeServerProgress(local, [], TOTAL_LEVELS, [
      { achievementKey: "firstCompletion", unlockedAt: "2026-08-01T00:00:00.000Z" },
      { achievementKey: "cleanRun", unlockedAt: "2026-08-05T00:00:00.000Z" },
    ]);

    expect(merged.achievements.firstCompletion?.unlockedAt).toBe("2026-08-01T00:00:00.000Z");
    expect(merged.achievements.cleanRun?.unlockedAt).toBe("2026-08-05T00:00:00.000Z");
  });

  it("ignores achievement keys the game does not define", () => {
    const merged = mergeServerProgress(localProgress(), [], TOTAL_LEVELS, [
      { achievementKey: "notARealAchievement", unlockedAt: "2026-08-01T00:00:00.000Z" },
    ]);

    expect(merged.achievements).toEqual({});
  });
});

describe("findUnsyncedAchievementKeys", () => {
  it("reports local achievements the account has not recorded", () => {
    const keys = findUnsyncedAchievementKeys(
      { firstCompletion: { unlockedAt: "2026-08-01T00:00:00.000Z" }, cleanRun: { unlockedAt: "2026-08-02T00:00:00.000Z" } },
      [{ achievementKey: "firstCompletion", unlockedAt: "2026-08-01T00:00:00.000Z" }],
    );

    expect(keys).toEqual(["cleanRun"]);
  });

  it("reports nothing when the account is already current", () => {
    expect(findUnsyncedAchievementKeys({}, [])).toEqual([]);
  });
});
