"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { GameEngine } from "@/game/engine/GameEngine";
import type { GameSnapshot, LevelDefinition } from "@/game/state/gameTypes";

interface GameCanvasProps {
  engineRef: MutableRefObject<GameEngine | null>;
  level: LevelDefinition;
  onSnapshotChange: (snapshot: GameSnapshot) => void;
}

export function GameCanvas({ engineRef, level, onSnapshotChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotChangeRef = useRef(onSnapshotChange);
  snapshotChangeRef.current = onSnapshotChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, level);
    engineRef.current = engine;
    const unsubscribe = engine.subscribe((snapshot) => snapshotChangeRef.current(snapshot));
    const resize = () => {
      engine.resize(canvas.clientWidth || level.width, window.devicePixelRatio || 1);
    };

    resize();
    const observer = new ResizeObserver(resize);
    engine.start();
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      unsubscribe();
      engine.stop();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [engineRef, level]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Maze game board"
      className="block h-auto w-full rounded-[inherit]"
    />
  );
}
