import type { GameSnapshot } from "@/game/state/gameTypes";

interface GameHudProps {
  snapshot: GameSnapshot;
}

export function GameHud({ snapshot }: GameHudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4 text-white sm:p-6" aria-label="Game information">
      <div className="flex flex-wrap items-start gap-3 sm:gap-5">
        <div className="text-left leading-none">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/65">Level</p>
          <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{snapshot.level}</p>
        </div>
        <Stat label="Score" value={snapshot.score.toString()} />
        <Stat label="Stars" value={`${snapshot.collectiblesCollected}/${snapshot.totalCollectibles}`} />
        <Stat label="Hits" value={`${snapshot.collisionsUsed}/${snapshot.maxCollisions}`} />
      </div>
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-neon-green text-neon-green shadow-[0_0_18px_rgba(57,255,20,0.8)] sm:h-16 sm:w-16" aria-label="Vehicle preview">
        <svg viewBox="0 0 32 32" className="h-8 w-8 fill-none stroke-current sm:h-9 sm:w-9" aria-hidden="true">
          <path d="M9 13.5 11.5 8h9L23 13.5M7 14h18v8H7zM10 22v2M22 22v2M10 17h.01M22 17h.01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[58px] text-left leading-none">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{label}</p>
      <p className="mt-1 text-lg font-black sm:text-xl">{value}</p>
    </div>
  );
}
