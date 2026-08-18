"use client";

import { useEffect, useRef, useState } from "react";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { AuthGate } from "@/components/auth/AuthGate";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameHud } from "@/components/game/GameHud";
import { GameOverlay } from "@/components/game/GameOverlay";
import { LevelSelect } from "@/components/game/LevelSelect";
import { MiniMap } from "@/components/game/MiniMap";
import { TouchControls } from "@/components/game/TouchControls";
import { getNewAchievementKeys } from "@/game/achievements/AchievementSystem";
import type { AchievementRecords } from "@/game/achievements/achievementTypes";
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
import type { AuthUser } from "@/types/auth";

type GameScreen = "auth" | "select" | "playing";
const defaultAudioSettings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };

export function GameShell() {
  const [screen, setScreen] = useState<GameScreen>("auth");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<LevelDefinition | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultAudioSettings);
  const [snapshot, setSnapshot] = useState(() => createInitialSnapshot(initialLevel, defaultAudioSettings));
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [levelRecords, setLevelRecords] = useState<Record<number, LevelRecord>>({});
  const [achievements, setAchievements] = useState<AchievementRecords>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [scoreRefreshKey, setScoreRefreshKey] = useState(0);
  const engineRef = useRef<GameEngine | null>(null);
  const gameFrameRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const submittedScoreKeys = useRef(new Set<string>());

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((result: { user?: AuthUser | null }) => {
        if (result.user) {
          setCurrentUser(result.user);
          setScreen("select");
        }
      })
      .catch(() => undefined)
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === gameFrameRef.current);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
    saveProgress({ ...baseProgress, version: PROGRESS_STORAGE_VERSION, unlockedLevel, levelRecords, achievements });
  }, [achievements, audioSettings, levelRecords, progressLoaded, unlockedLevel]);

  const handleAuthenticated = (user: AuthUser) => {
    setCurrentUser(user);
    setGuestMode(false);
    setScreen("select");
  };

  const handleGuest = () => {
    setCurrentUser(null);
    setGuestMode(true);
    setScreen("select");
  };

  const handleLogout = () => {
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      setCurrentUser(null);
      setGuestMode(false);
      setScreen("auth");
    });
  };

  const handleSelectLevel = (level: LevelDefinition) => {
    setActiveLevel(level);
    setSnapshot(createInitialSnapshot(level, audioSettings));
    setScreen("playing");
  };

  const handleSnapshotChange = (nextSnapshot: GameSnapshot) => {
    setSnapshot(nextSnapshot);
    setAudioSettings({ soundEnabled: nextSnapshot.soundEnabled, musicEnabled: nextSnapshot.musicEnabled });
    if (nextSnapshot.status !== "completed") return;

    if (currentUser && activeLevel) {
      const submissionKey = `${currentUser.id}:${nextSnapshot.level}:${nextSnapshot.score}`;
      if (!submittedScoreKeys.current.has(submissionKey)) {
        submittedScoreKeys.current.add(submissionKey);
        void submitScore(nextSnapshot, activeLevel.level).then((saved) => {
          if (saved) setScoreRefreshKey((current) => current + 1);
        });
      }
    }

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
    const newAchievementKeys = getNewAchievementKeys({ snapshot: nextSnapshot, level: completedLevel, completedLevelCount, totalLevelCount: LEVEL_CONFIGS.length, existing: achievements });
    if (newAchievementKeys.length > 0) {
      setAchievements((current) => {
        const next = { ...current };
        const unlockedAt = new Date().toISOString();
        for (const key of newAchievementKeys) if (!next[key]) next[key] = { unlockedAt };
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
  const handleToggleFullscreen = () => {
    const frame = gameFrameRef.current;
    if (!frame) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void frame.requestFullscreen().catch(() => undefined);
    }
  };
  const handleActionChange = (action: VehicleAction, pressed: boolean) => engineRef.current?.setAction(action, pressed);
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

  if (authLoading) return <main className="grid min-h-screen place-items-center bg-black text-sm font-bold uppercase tracking-[0.2em] text-white/50">Checking driver session...</main>;
  if (screen === "auth") return <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-8"><AuthGate onAuthenticated={handleAuthenticated} onGuest={handleGuest} /></main>;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-bold uppercase tracking-[0.28em] text-neon-red">Neon Maze</p><h1 className="text-4xl font-black tracking-tight sm:text-6xl">Drive the route.</h1></div>
          {screen === "playing" && <button type="button" onClick={handleBackToLevels} className="self-start rounded-lg border border-white/25 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:border-white sm:self-auto">Level select</button>}
        </header>

        {screen === "select" && <>
          <AccountDashboard user={currentUser} guestMode={guestMode} levels={LEVEL_CONFIGS} refreshKey={scoreRefreshKey} onLogout={handleLogout} />
          <LevelSelect levels={LEVEL_CONFIGS} unlockedLevel={unlockedLevel} records={levelRecords} achievements={achievements} onSelect={handleSelectLevel} onResetProgress={handleResetProgress} />
        </>}

        {screen === "playing" && activeLevel && <section ref={gameFrameRef} className="game-frame relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_35px_rgba(255,0,60,0.12)] sm:rounded-3xl">
          <GameCanvas key={activeLevel.level} engineRef={engineRef} level={activeLevel} audioSettings={audioSettings} onSnapshotChange={handleSnapshotChange} />
          <GameHud snapshot={snapshot} onPause={handlePause} onResume={handleResume} onToggleSound={handleToggleSound} onToggleMusic={handleToggleMusic} onToggleFullscreen={handleToggleFullscreen} isFullscreen={isFullscreen} />
          <MiniMap level={activeLevel} engineRef={engineRef} />
          <GameOverlay snapshot={snapshot} onResume={handleResume} onRetry={handleRetry} onContinue={handleContinue} continueLabel={activeLevel.level === LEVEL_CONFIGS.length ? "Level select" : "Next level"} />
          <div className="pointer-events-auto absolute bottom-3 left-3 z-[15] rounded-2xl border border-white/20 bg-black/45 p-2 shadow-[0_0_18px_rgba(0,0,0,0.45)] backdrop-blur-md lg:hidden" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
            <div className="mb-2 flex justify-center gap-2"><button type="button" onClick={handleToggleSound} className="rounded-lg border border-white/20 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/75">{snapshot.soundEnabled ? "SFX" : "SFX off"}</button><button type="button" onClick={handleToggleMusic} className="rounded-lg border border-white/20 px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/75">{snapshot.musicEnabled ? "Music" : "Music off"}</button></div>
            <TouchControls onActionChange={handleActionChange} />
          </div>
        </section>}

        <footer className="flex flex-col gap-2 text-sm text-white/45 sm:flex-row sm:justify-between"><span>{screen === "select" ? `${LEVEL_CONFIGS.length} authored routes` : `Level ${activeLevel?.level} active`}</span><span>Account scores and guest play active</span></footer>
      </div>
    </main>
  );
}

async function submitScore(snapshot: GameSnapshot, level: number) {
  try {
    const response = await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level, collectiblesCollected: snapshot.collectiblesCollected, collisionsUsed: snapshot.collisionsUsed, remainingTimeSeconds: snapshot.remainingTimeSeconds }) });
    return response.ok;
  } catch {
    return false;
  }
}

function createInitialSnapshot(level: LevelDefinition, audioSettings: AudioSettings): GameSnapshot {
  return { status: "idle", level: level.level, score: 0, collisionsUsed: 0, maxCollisions: level.maxCollisions, collectiblesCollected: 0, totalCollectibles: level.collectibles.length, remainingTimeSeconds: level.timeLimitSeconds, countdownSeconds: 0, soundEnabled: audioSettings.soundEnabled, musicEnabled: audioSettings.musicEnabled };
}
