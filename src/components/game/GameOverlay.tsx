import type { GameSnapshot } from "@/game/state/gameTypes";

interface GameOverlayProps {
  snapshot: GameSnapshot;
}

export function GameOverlay({ snapshot }: GameOverlayProps) {
  if (snapshot.status !== "failed") return null;

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6 text-center" role="alert" aria-live="assertive">
      <div className="max-w-sm rounded-2xl border border-neon-red/70 bg-black/90 px-6 py-7 shadow-[0_0_28px_rgba(255,0,60,0.35)]">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neon-red">Run ended</p>
        <h2 className="mt-2 text-3xl font-black text-white">Vehicle damaged</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">
          The collision limit was reached. A retry option will be added with the next game-state phase.
        </p>
        <p className="mt-5 text-sm font-bold text-white">
          Hits: {snapshot.collisionsUsed} / {snapshot.maxCollisions}
        </p>
      </div>
    </div>
  );
}
