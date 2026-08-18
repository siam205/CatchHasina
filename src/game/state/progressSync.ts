import type { AchievementRecords } from "@/game/achievements/achievementTypes";
import { isAchievementKey } from "@/storage/localStorageAdapter";
import type { LevelRecord } from "@/game/state/gameTypes";
import type { PersistedProgress } from "@/storage/storageTypes";
import type { ServerAchievement, ServerScore } from "@/types/auth";

/**
 * Local storage and the account database each hold half the picture: the browser knows which
 * levels are unlocked, the server knows which levels were actually cleared. Playing on a second
 * device — or clearing site data — leaves the browser behind, so the two are merged on sign-in.
 * The merge only ever moves progress forward.
 */
export function mergeServerProgress(
  local: PersistedProgress,
  scores: ServerScore[],
  totalLevels: number,
  serverAchievements: ServerAchievement[] = [],
): PersistedProgress {
  return {
    ...local,
    unlockedLevel: mergeUnlockedLevel(local.unlockedLevel, scores, totalLevels),
    levelRecords: mergeLevelRecords(local.levelRecords, scores),
    achievements: mergeAchievements(local.achievements, serverAchievements),
  };
}

/** Clearing a level on any device unlocks the next one everywhere. */
export function mergeUnlockedLevel(localUnlockedLevel: number, scores: ServerScore[], totalLevels: number) {
  const clampedLocal = clampLevel(localUnlockedLevel, totalLevels);
  const clearedLevels = scores.map((score) => score.level).filter((level) => Number.isInteger(level) && level >= 1);
  if (clearedLevels.length === 0) return clampedLocal;

  const serverUnlockedLevel = clampLevel(Math.max(...clearedLevels) + 1, totalLevels);
  return Math.max(clampedLocal, serverUnlockedLevel);
}

export function mergeLevelRecords(localRecords: Record<number, LevelRecord>, scores: ServerScore[]) {
  const merged: Record<number, LevelRecord> = { ...localRecords };

  for (const score of scores) {
    if (!Number.isInteger(score.level) || score.level < 1) continue;
    const fromServer: LevelRecord = {
      completions: 1,
      bestScore: score.score,
      bestCollisions: score.collisionsUsed,
      bestCollectibles: score.collectiblesCollected,
      bestRemainingTimeSeconds: score.remainingTimeSeconds,
    };
    const existing = merged[score.level];
    merged[score.level] = existing ? bestOf(existing, fromServer) : fromServer;
  }

  return merged;
}

function bestOf(first: LevelRecord, second: LevelRecord): LevelRecord {
  return {
    completions: Math.max(first.completions, second.completions),
    bestScore: Math.max(first.bestScore, second.bestScore),
    bestCollisions: Math.min(first.bestCollisions, second.bestCollisions),
    bestCollectibles: Math.max(first.bestCollectibles, second.bestCollectibles),
    bestRemainingTimeSeconds: Math.max(first.bestRemainingTimeSeconds, second.bestRemainingTimeSeconds),
  };
}

export function mergeAchievements(localAchievements: AchievementRecords, serverAchievements: ServerAchievement[]) {
  const merged: AchievementRecords = { ...localAchievements };

  for (const achievement of serverAchievements) {
    if (!isAchievementKey(achievement.achievementKey)) continue;
    const existing = merged[achievement.achievementKey];
    // Keep whichever unlock happened first, so the earliest date survives a device switch.
    if (!existing || achievement.unlockedAt < existing.unlockedAt) {
      merged[achievement.achievementKey] = { unlockedAt: achievement.unlockedAt };
    }
  }

  return merged;
}

/** Achievement keys held locally that the account has not recorded yet. */
export function findUnsyncedAchievementKeys(
  localAchievements: AchievementRecords,
  serverAchievements: ServerAchievement[],
) {
  const known = new Set(serverAchievements.map((achievement) => achievement.achievementKey));
  return Object.keys(localAchievements).filter((key) => !known.has(key));
}

function clampLevel(level: number, totalLevels: number) {
  if (!Number.isInteger(level) || level < 1) return 1;
  return Math.min(level, totalLevels);
}
