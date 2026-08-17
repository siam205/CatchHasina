"use client";

import { useRef, useState } from "react";
import { GameCanvas } from "@/components/game/GameCanvas";
import { GameHud } from "@/components/game/GameHud";
import { GameOverlay } from "@/components/game/GameOverlay";
import { TouchControls } from "@/components/game/TouchControls";
import { GameEngine } from "@/game/engine/GameEngine";
import { initialLevel } from "@/game/levels/levelConfig";
import type { GameSnapshot, VehicleAction } from "@/game/state/gameTypes";

const initialSnapshot: GameSnapshot = {
  status: "idle",
  level: initialLevel.level,
  score: 0,
  collisionsUsed: 0,
  maxCollisions: initialLevel.maxCollisions,
  collectiblesCollected: 0,
  totalCollectibles: initialLevel.collectibles.length,
};

export function GameShell() {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const engineRef = useRef<GameEngine | null>(null);

  const handleActionChange = (action: VehicleAction, pressed: boolean) => {
    engineRef.current?.setAction(action, pressed);
  };

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-neon-red">Neon Maze</p>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Drive the route.</h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-white/55">A top-down vehicle maze. The neon board is ready for driving controls in Phase 3.</p>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_35px_rgba(255,0,60,0.12)] sm:rounded-3xl">
          <GameCanvas engineRef={engineRef} onSnapshotChange={setSnapshot} />
          <GameHud snapshot={snapshot} />
          <GameOverlay snapshot={snapshot} />
          <div className="border-t border-white/10 bg-black/80 p-4 md:hidden">
            <TouchControls onActionChange={handleActionChange} />
          </div>
        </section>

        <footer className="flex flex-col gap-2 text-sm text-white/45 sm:flex-row sm:justify-between">
          <span>Level 1 vehicle preview</span>
          <span>Timer and retry flow arrive in the next phase</span>
        </footer>
      </div>
    </main>
  );
}
