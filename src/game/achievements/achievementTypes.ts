export const ACHIEVEMENT_DEFINITIONS = [
  {
    key: "firstCompletion",
    label: "First route",
    description: "Complete your first level.",
  },
  {
    key: "threeLevels",
    label: "Route master",
    description: "Complete three different levels.",
  },
  {
    key: "allLevels",
    label: "Neon navigator",
    description: "Complete every available level.",
  },
  {
    key: "allTargets",
    label: "Star collector",
    description: "Collect every target in a level.",
  },
  {
    key: "cleanRun",
    label: "Clean run",
    description: "Complete a level without collisions.",
  },
] as const;

export type AchievementKey = (typeof ACHIEVEMENT_DEFINITIONS)[number]["key"];

export interface AchievementRecord {
  unlockedAt: string;
}

export type AchievementRecords = Partial<Record<AchievementKey, AchievementRecord>>;
