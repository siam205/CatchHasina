import type { AudioSettings, LevelRecord } from "@/game/state/gameTypes";
import type { AchievementRecords } from "@/game/achievements/achievementTypes";

export const PROGRESS_STORAGE_KEY = "neon-maze-progress";
export const PROGRESS_STORAGE_VERSION = 1;

export interface PersistedProgress {
  version: 1;
  unlockedLevel: number;
  levelRecords: Record<number, LevelRecord>;
  achievements: AchievementRecords;
  audioSettings: AudioSettings;
}
