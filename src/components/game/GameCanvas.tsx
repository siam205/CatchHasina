"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { GameEngine } from "@/game/engine/GameEngine";
import type { AudioSettings, GameSnapshot, LevelDefinition } from "@/game/state/gameTypes";

interface GameCanvasProps {
  engineRef: MutableRefObject<GameEngine | null>;
  level: LevelDefinition;
  audioSettings: AudioSettings;
  onSnapshotChange: (snapshot: GameSnapshot) => void;
}

export function GameCanvas({ engineRef, level, audioSettings, onSnapshotChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotChangeRef = useRef(onSnapshotChange);
  const audioSettingsRef = useRef(audioSettings);
  snapshotChangeRef.current = onSnapshotChange;
  audioSettingsRef.current = audioSettings;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const engine = new GameEngine(canvas, level, audioSettingsRef.current, motionPreference.matches);
    engineRef.current = engine;
    const unsubscribe = engine.subscribe((snapshot) => snapshotChangeRef.current(snapshot));
    const resize = () => {
      engine.resize(canvas.clientWidth || level.width, window.devicePixelRatio || 1);
    };

    resize();
    const observer = new ResizeObserver(resize);
    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => engine.setReducedMotion(event.matches);
    motionPreference.addEventListener("change", handleMotionPreferenceChange);
    engine.start();
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      motionPreference.removeEventListener("change", handleMotionPreferenceChange);
      unsubscribe();
      engine.destroy();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [engineRef, level]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Maze game board"
      className="game-canvas block h-auto w-full rounded-[inherit]"
    />
  );
}
