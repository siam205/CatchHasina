import type { GameSnapshot } from "@/game/state/gameTypes";

interface GameOverlayProps {
  snapshot: GameSnapshot;
  onResume: () => void;
  onRetry: () => void;
  onContinue: () => void;
  continueLabel: string;
}

export function GameOverlay({ snapshot, onResume, onRetry, onContinue, continueLabel }: GameOverlayProps) {
  if (snapshot.status === "starting") {
    return (
      <div className="absolute inset-0 z-20 grid place-items-center bg-black/45 text-center" aria-live="assertive">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neon-green">Get ready</p>
          <p className="mt-2 text-8xl font-black leading-none text-white drop-shadow-[0_0_18px_rgba(57,255,20,0.8)]">{snapshot.countdownSeconds}</p>
        </div>
      </div>
    );
  }

  if (snapshot.status === "paused") {
    return (
      <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6 text-center" role="dialog" aria-label="Game paused">
        <div className="max-w-sm rounded-2xl border border-white/30 bg-black/90 px-6 py-7">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">Session paused</p>
          <h2 className="mt-2 text-3xl font-black text-white">Take a breath.</h2>
          <button type="button" onClick={onResume} className="mt-6 rounded-lg bg-neon-green px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-black shadow-[0_0_16px_rgba(57,255,20,0.45)]">
            Resume game
          </button>
        </div>
      </div>
    );
  }

  if (snapshot.status !== "failed" && snapshot.status !== "completed") return null;

  const completed = snapshot.status === "completed";
  const timedOut = snapshot.failureReason === "timeLimit";
  const exploded = snapshot.failureReason === "hazard";

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6 text-center" role="alert" aria-live="assertive">
      <div className={`max-w-sm rounded-2xl border bg-black/90 px-6 py-7 shadow-[0_0_28px_rgba(57,255,20,0.3)] ${completed ? "border-neon-green/70" : "border-neon-red/70 shadow-[0_0_28px_rgba(255,0,60,0.35)]"}`}>
        <p className={`text-xs font-bold uppercase tracking-[0.24em] ${completed ? "text-neon-green" : "text-neon-red"}`}>
          {completed ? "Destination reached" : "Run ended"}
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">{completed ? "Level complete" : exploded ? "Vehicle exploded" : timedOut ? "Time expired" : "Vehicle damaged"}</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">
          {completed ? "You reached the destination and secured the route." : exploded ? "The vehicle touched a hazard and detonated." : timedOut ? "The time limit was reached." : "The collision limit was reached."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <Result label="Score" value={snapshot.score.toString()} />
          <Result label="Stars" value={`${snapshot.collectiblesCollected}/${snapshot.totalCollectibles}`} />
        </div>
        {!completed && <p className="mt-4 text-sm font-bold text-white">Hits: {snapshot.collisionsUsed} / {snapshot.maxCollisions}</p>}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRetry} className="rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:border-white">
            Retry level
          </button>
          {completed && <button type="button" onClick={onContinue} className="rounded-lg bg-neon-green px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-black shadow-[0_0_16px_rgba(57,255,20,0.45)]">{continueLabel}</button>}
        </div>
        {completed && continueLabel !== "Level select" && <p className="mt-4 text-xs text-white/40">The next authored route is now unlocked.</p>}
      </div>
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}
