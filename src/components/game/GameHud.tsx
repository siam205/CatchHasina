import type { GameSnapshot } from "@/game/state/gameTypes";
import { getVehicleHealth } from "@/lib/vehicleHealth";

interface GameHudProps {
  snapshot: GameSnapshot;
  onPause: () => void;
  onResume: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export function GameHud({ snapshot, onPause, onResume, onToggleSound, onToggleMusic, onToggleFullscreen, isFullscreen }: GameHudProps) {
  const paused = snapshot.status === "paused";
  const canTogglePause = snapshot.status === "playing" || paused;
  const health = getVehicleHealth(snapshot.maxCollisions, snapshot.collisionsUsed);
  const healthRadius = 24;
  const healthCircumference = 2 * Math.PI * healthRadius;
  const healthOffset = healthCircumference * (1 - health.ratio);

  return (
    <div className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3 text-white sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:p-6" aria-label="Game information">
      <div className="flex flex-wrap items-start gap-3 sm:gap-5">
        <div className="text-left leading-none">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/65">Level</p>
          <p className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{snapshot.level}</p>
        </div>
        <Stat label="Score" value={snapshot.score.toString()} />
        <Stat label="Stars" value={`${snapshot.collectiblesCollected}/${snapshot.totalCollectibles}`} />
        <Stat label="Hits" value={`${snapshot.collisionsUsed}/${snapshot.maxCollisions}`} />
        <Stat label="Time" value={formatTime(snapshot.remainingTimeSeconds)} />
      </div>
      <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
        <div className="hidden gap-2 sm:flex">
          <button type="button" onClick={onToggleSound} aria-pressed={snapshot.soundEnabled} className="rounded-lg border border-white/20 bg-black/60 px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/75 transition hover:border-white">
            {snapshot.soundEnabled ? "SFX" : "SFX off"}
          </button>
          <button type="button" onClick={onToggleMusic} aria-pressed={snapshot.musicEnabled} className="rounded-lg border border-white/20 bg-black/60 px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/75 transition hover:border-white">
            {snapshot.musicEnabled ? "Music" : "Music off"}
          </button>
        </div>
        <button
          type="button"
          onClick={paused ? onResume : onPause}
          disabled={!canTogglePause}
          className="rounded-lg border border-white/30 bg-black/60 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button type="button" onClick={onToggleFullscreen} className="rounded-lg border border-white/30 bg-black/60 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:border-white">
          {isFullscreen ? "Exit full" : "Full screen"}
        </button>
        <div
          className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full sm:h-16 sm:w-16"
          style={{ color: health.color, filter: `drop-shadow(0 0 8px ${health.color})` }}
          aria-label={`Vehicle health: ${health.remaining} of ${snapshot.maxCollisions} collision allowance remaining`}
          title={`Vehicle health: ${health.remaining}/${snapshot.maxCollisions}`}
        >
          <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90 fill-none" aria-hidden="true">
            <circle cx="32" cy="32" r={healthRadius} stroke="currentColor" strokeOpacity="0.18" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r={healthRadius}
              stroke="currentColor"
              strokeDasharray={healthCircumference}
              strokeDashoffset={healthOffset}
              strokeLinecap="round"
              strokeWidth="4"
              style={{ transition: "stroke-dashoffset 250ms ease, color 250ms ease" }}
            />
          </svg>
          <svg viewBox="0 0 32 32" className="pointer-events-none absolute inset-0 m-auto h-8 w-8 fill-none stroke-current sm:h-9 sm:w-9" aria-hidden="true">
            <path d="M9 13.5 11.5 8h9L23 13.5M7 14h18v8H7zM10 22v2M22 22v2M10 17h.01M22 17h.01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
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

function formatTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
