import { ACHIEVEMENT_DEFINITIONS, type AchievementKey } from "@/game/achievements/achievementTypes";
import type { AudioSettings, LevelRecord } from "@/game/state/gameTypes";
import {
  PROGRESS_STORAGE_KEY,
  PROGRESS_STORAGE_VERSION,
  type PersistedProgress,
} from "./storageTypes";

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  soundEnabled: true,
  musicEnabled: true,
};

export function createDefaultProgress(audioSettings: AudioSettings = DEFAULT_AUDIO_SETTINGS): PersistedProgress {
  return {
    version: PROGRESS_STORAGE_VERSION,
    unlockedLevel: 1,
    levelRecords: {},
    achievements: {},
    audioSettings: { ...audioSettings },
  };
}

export function loadProgress(): PersistedProgress {
  const fallback = createDefaultProgress();
  if (typeof window === "undefined") return fallback;

  try {
    const serialized = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!serialized) return fallback;
    return normalizeProgress(JSON.parse(serialized));
  } catch {
    return fallback;
  }
}

export function saveProgress(progress: PersistedProgress) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable in private browsing or when quota is exceeded.
  }
}

export function clearProgress() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // Ignore storage failures; the in-memory session can still be reset.
  }
}

function normalizeProgress(value: unknown): PersistedProgress {
  const fallback = createDefaultProgress();
  if (!isRecord(value) || value.version !== PROGRESS_STORAGE_VERSION) return fallback;

  return {
    version: PROGRESS_STORAGE_VERSION,
    unlockedLevel: normalizePositiveInteger(value.unlockedLevel, 1),
    levelRecords: normalizeLevelRecords(value.levelRecords),
    achievements: normalizeAchievements(value.achievements),
    audioSettings: normalizeAudioSettings(value.audioSettings),
  };
}

function normalizeLevelRecords(value: unknown): Record<number, LevelRecord> {
  if (!isRecord(value)) return {};

  const records: Record<number, LevelRecord> = {};
  for (const [level, record] of Object.entries(value)) {
    const levelNumber = Number(level);
    if (!Number.isInteger(levelNumber) || levelNumber < 1) continue;
    if (!isRecord(record)) continue;
    const normalized = normalizeLevelRecord(record);
    if (normalized) records[levelNumber] = normalized;
  }
  return records;
}

function normalizeLevelRecord(value: Record<string, unknown>): LevelRecord | null {
  const fields = [
    value.completions,
    value.bestScore,
    value.bestCollisions,
    value.bestCollectibles,
    value.bestRemainingTimeSeconds,
  ];
  if (!fields.every((field) => typeof field === "number" && Number.isFinite(field) && field >= 0)) return null;

  return {
    completions: Math.floor(value.completions as number),
    bestScore: value.bestScore as number,
    bestCollisions: value.bestCollisions as number,
    bestCollectibles: value.bestCollectibles as number,
    bestRemainingTimeSeconds: value.bestRemainingTimeSeconds as number,
  };
}

function normalizeAchievements(value: unknown) {
  if (!isRecord(value)) return {};

  const achievements = {} as PersistedProgress["achievements"];
  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const record = value[definition.key];
    if (!isRecord(record) || typeof record.unlockedAt !== "string") continue;
    achievements[definition.key] = { unlockedAt: record.unlockedAt };
  }
  return achievements;
}

function normalizeAudioSettings(value: unknown): AudioSettings {
  if (!isRecord(value)) return { ...DEFAULT_AUDIO_SETTINGS };
  return {
    soundEnabled: typeof value.soundEnabled === "boolean" ? value.soundEnabled : DEFAULT_AUDIO_SETTINGS.soundEnabled,
    musicEnabled: typeof value.musicEnabled === "boolean" ? value.musicEnabled : DEFAULT_AUDIO_SETTINGS.musicEnabled,
  };
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAchievementKey(value: string): value is AchievementKey {
  return ACHIEVEMENT_DEFINITIONS.some((definition) => definition.key === value);
}
