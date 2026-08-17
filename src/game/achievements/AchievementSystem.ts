import type { GameSnapshot, LevelDefinition } from "@/game/state/gameTypes";
import type { AchievementKey, AchievementRecords } from "./achievementTypes";

interface AchievementContext {
  snapshot: GameSnapshot;
  level: LevelDefinition;
  completedLevelCount: number;
  totalLevelCount: number;
  existing: AchievementRecords;
}

export function getNewAchievementKeys({
  snapshot,
  level,
  completedLevelCount,
  totalLevelCount,
  existing,
}: AchievementContext): AchievementKey[] {
  const unlocked: AchievementKey[] = [];

  if (completedLevelCount >= 1 && !existing.firstCompletion) unlocked.push("firstCompletion");
  if (completedLevelCount >= 3 && !existing.threeLevels) unlocked.push("threeLevels");
  if (completedLevelCount >= totalLevelCount && !existing.allLevels) unlocked.push("allLevels");
  if (snapshot.collectiblesCollected === level.collectibles.length && !existing.allTargets) unlocked.push("allTargets");
  if (snapshot.collisionsUsed === 0 && !existing.cleanRun) unlocked.push("cleanRun");

  return unlocked;
}
