import { beforeEach, describe, expect, it } from "vitest";
import { loadProgress, saveProgress } from "./localStorageAdapter";
import { PROGRESS_STORAGE_KEY } from "./storageTypes";

describe("localStorageAdapter", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips progress through localStorage", () => {
    const progress = loadProgress();
    progress.unlockedLevel = 3;
    progress.levelRecords[1] = {
      completions: 2,
      bestScore: 1800,
      bestCollisions: 1,
      bestCollectibles: 3,
      bestRemainingTimeSeconds: 42,
    };
    progress.achievements.firstCompletion = { unlockedAt: "2026-01-01T00:00:00.000Z" };

    saveProgress(progress);

    expect(loadProgress()).toEqual(progress);
  });

  it("returns defaults for malformed or unsupported data", () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ version: 99, unlockedLevel: 3 }));

    const progress = loadProgress();

    expect(progress.unlockedLevel).toBe(1);
    expect(progress.levelRecords).toEqual({});
    expect(progress.achievements).toEqual({});
  });
});
