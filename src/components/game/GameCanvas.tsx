"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { GameEngine } from "@/game/engine/GameEngine";
import { initialLevel } from "@/game/levels/levelConfig";
import type { GameSnapshot } from "@/game/state/gameTypes";

interface GameCanvasProps {
  engineRef: MutableRefObject<GameEngine | null>;
  onSnapshotChange: (snapshot: GameSnapshot) => void;
}

export function GameCanvas({ engineRef, onSnapshotChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, initialLevel);
    engineRef.current = engine;
    const unsubscribe = engine.subscribe(onSnapshotChange);
    const resize = () => {
      engine.resize(canvas.clientWidth || initialLevel.width, window.devicePixelRatio || 1);
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
  }, [engineRef, onSnapshotChange]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Maze game board"
      className="block h-auto w-full rounded-[inherit]"
    />
  );
}
