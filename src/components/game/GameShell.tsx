"use client";

import { useEffect, useRef, useState } from "react";
import { getNewAchievementKeys } from "@/game/achievements/AchievementSystem";
import type { AchievementRecords } from "@/game/achievements/achievementTypes";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameHud } from "@/components/game/GameHud";
import { GameOverlay } from "@/components/game/GameOverlay";
import { LevelSelect } from "@/components/game/LevelSelect";
import { TouchControls } from "@/components/game/TouchControls";
import { GameEngine } from "@/game/engine/GameEngine";
import { LEVEL_CONFIGS, initialLevel } from "@/game/levels/levelConfig";
import type { AudioSettings, GameSnapshot, LevelDefinition, LevelRecord, VehicleAction } from "@/game/state/gameTypes";
import {
  clearProgress,
  createDefaultProgress,
  DEFAULT_AUDIO_SETTINGS,
  loadProgress,
  saveProgress,
} from "@/storage/localStorageAdapter";
import { PROGRESS_STORAGE_VERSION } from "@/storage/storageTypes";

type GameScreen = "select" | "playing";
const defaultAudioSettings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };

export function GameShell() {
  const [screen, setScreen] = useState<GameScreen>("select");
  const [activeLevel, setActiveLevel] = useState<LevelDefinition | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultAudioSettings);
  const [snapshot, setSnapshot] = useState(() => createInitialSnapshot(initialLevel, defaultAudioSettings));
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [levelRecords, setLevelRecords] = useState<Record<number, LevelRecord>>({});
  const [achievements, setAchievements] = useState<AchievementRecords>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    const progress = loadProgress();
    setUnlockedLevel(Math.max(1, Math.min(progress.unlockedLevel, LEVEL_CONFIGS.length)));
    setLevelRecords(progress.levelRecords);
    setAchievements(progress.achievements);
    setAudioSettings(progress.audioSettings);
    setSnapshot(createInitialSnapshot(initialLevel, progress.audioSettings));
    setProgressLoaded(true);
  }, []);

  useEffect(() => {
    if (!progressLoaded) return;
    const baseProgress = createDefaultProgress(audioSettings);
    saveProgress({
      ...baseProgress,
      version: PROGRESS_STORAGE_VERSION,
      unlockedLevel,
      levelRecords,
      achievements,
    });
  }, [achievements, audioSettings, levelRecords, progressLoaded, unlockedLevel]);

  const handleSelectLevel = (level: LevelDefinition) => {
    setActiveLevel(level);
    setSnapshot(createInitialSnapshot(level, audioSettings));
    setScreen("playing");
  };

  const handleSnapshotChange = (nextSnapshot: GameSnapshot) => {
    setSnapshot(nextSnapshot);
    setAudioSettings({ soundEnabled: nextSnapshot.soundEnabled, musicEnabled: nextSnapshot.musicEnabled });
    if (nextSnapshot.status !== "completed") return;

    setUnlockedLevel((current) => Math.max(current, Math.min(nextSnapshot.level + 1, LEVEL_CONFIGS.length)));
    setLevelRecords((current) => {
      const previous = current[nextSnapshot.level];
      const nextRecord: LevelRecord = previous
        ? {
            completions: previous.completions + 1,
            bestScore: Math.max(previous.bestScore, nextSnapshot.score),
            bestCollisions: Math.min(previous.bestCollisions, nextSnapshot.collisionsUsed),
            bestCollectibles: Math.max(previous.bestCollectibles, nextSnapshot.collectiblesCollected),
            bestRemainingTimeSeconds: Math.max(previous.bestRemainingTimeSeconds, nextSnapshot.remainingTimeSeconds),
          }
        : {
            completions: 1,
            bestScore: nextSnapshot.score,
            bestCollisions: nextSnapshot.collisionsUsed,
            bestCollectibles: nextSnapshot.collectiblesCollected,
            bestRemainingTimeSeconds: nextSnapshot.remainingTimeSeconds,
          };

      return { ...current, [nextSnapshot.level]: nextRecord };
    });

    const completedLevel = activeLevel ?? initialLevel;
    const completedLevelCount = Object.keys(levelRecords).length + (levelRecords[nextSnapshot.level] ? 0 : 1);
    const newAchievementKeys = getNewAchievementKeys({
      snapshot: nextSnapshot,
      level: completedLevel,
      completedLevelCount,
      totalLevelCount: LEVEL_CONFIGS.length,
      existing: achievements,
    });
    if (newAchievementKeys.length > 0) {
      setAchievements((current) => {
        const next = { ...current };
        const unlockedAt = new Date().toISOString();
        for (const key of newAchievementKeys) {
          if (!next[key]) next[key] = { unlockedAt };
        }
        return next;
      });
    }
  };

  const handleBackToLevels = () => {
    engineRef.current?.stop();
    setActiveLevel(null);
    setSnapshot(createInitialSnapshot(initialLevel, audioSettings));
    setScreen("select");
  };

  const handleContinue = () => {
    if (!activeLevel) return;

    const nextLevel = LEVEL_CONFIGS.find((level) => level.level === activeLevel.level + 1);
    if (nextLevel) handleSelectLevel(nextLevel);
    else handleBackToLevels();
  };

  const handleRetry = () => engineRef.current?.restart();
  const handlePause = () => engineRef.current?.pause();
  const handleResume = () => engineRef.current?.resume();
  const handleToggleSound = () => engineRef.current?.toggleSound();
  const handleToggleMusic = () => engineRef.current?.toggleMusic();
  const handleResetProgress = () => {
    if (typeof window !== "undefined" && !window.confirm("Reset all local progress and achievements?")) return;
    clearProgress();
    const reset = createDefaultProgress(defaultAudioSettings);
    setUnlockedLevel(reset.unlockedLevel);
    setLevelRecords(reset.levelRecords);
    setAchievements(reset.achievements);
    setAudioSettings(reset.audioSettings);
    setSnapshot(createInitialSnapshot(initialLevel, reset.audioSettings));
    setProgressLoaded(true);
  };
  const handleActionChange = (action: VehicleAction, pressed: boolean) => {
    engineRef.current?.setAction(action, pressed);
  };

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-neon-red">Neon Maze</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Drive the route.</h1>
          </div>
          {screen === "playing" && (
            <button type="button" onClick={handleBackToLevels} className="self-start rounded-lg border border-white/25 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:border-white sm:self-auto">
              Level select
            </button>
          )}
        </header>

        {screen === "select" && (
          <LevelSelect levels={LEVEL_CONFIGS} unlockedLevel={unlockedLevel} records={levelRecords} achievements={achievements} onSelect={handleSelectLevel} onResetProgress={handleResetProgress} />
        )}

        {screen === "playing" && activeLevel && (
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_35px_rgba(255,0,60,0.12)] sm:rounded-3xl">
            <GameCanvas key={activeLevel.level} engineRef={engineRef} level={activeLevel} audioSettings={audioSettings} onSnapshotChange={handleSnapshotChange} />
            <GameHud snapshot={snapshot} onPause={handlePause} onResume={handleResume} onToggleSound={handleToggleSound} onToggleMusic={handleToggleMusic} />
            <GameOverlay
              snapshot={snapshot}
              onResume={handleResume}
              onRetry={handleRetry}
              onContinue={handleContinue}
              continueLabel={activeLevel.level === LEVEL_CONFIGS.length ? "Level select" : "Next level"}
            />
            <div className="border-t border-white/10 bg-black/80 p-4 md:hidden">
              <div className="mb-3 flex justify-center gap-2">
                <button type="button" onClick={handleToggleSound} className="rounded-lg border border-white/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/75">{snapshot.soundEnabled ? "SFX on" : "SFX off"}</button>
                <button type="button" onClick={handleToggleMusic} className="rounded-lg border border-white/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/75">{snapshot.musicEnabled ? "Music on" : "Music off"}</button>
              </div>
              <TouchControls onActionChange={handleActionChange} />
            </div>
          </section>
        )}

        <footer className="flex flex-col gap-2 text-sm text-white/45 sm:flex-row sm:justify-between">
          <span>{screen === "select" ? "Three authored routes" : `Level ${activeLevel?.level} active`}</span>
          <span>Level progression and session records active</span>
        </footer>
      </div>
    </main>
  );
}

function createInitialSnapshot(level: LevelDefinition, audioSettings: AudioSettings): GameSnapshot {
  return {
    status: "idle",
    level: level.level,
    score: 0,
    collisionsUsed: 0,
    maxCollisions: level.maxCollisions,
    collectiblesCollected: 0,
    totalCollectibles: level.collectibles.length,
    remainingTimeSeconds: level.timeLimitSeconds,
    countdownSeconds: 0,
    soundEnabled: audioSettings.soundEnabled,
    musicEnabled: audioSettings.musicEnabled,
  };
}
