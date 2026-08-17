import type { GameSnapshot } from "@/game/state/gameTypes";

interface GameOverlayProps {
  snapshot: GameSnapshot;
}

export function GameOverlay({ snapshot }: GameOverlayProps) {
  if (snapshot.status !== "failed" && snapshot.status !== "completed") return null;

  const completed = snapshot.status === "completed";

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6 text-center" role="alert" aria-live="assertive">
      <div className={`max-w-sm rounded-2xl border bg-black/90 px-6 py-7 shadow-[0_0_28px_rgba(57,255,20,0.3)] ${completed ? "border-neon-green/70" : "border-neon-red/70 shadow-[0_0_28px_rgba(255,0,60,0.35)]"}`}>
        <p className={`text-xs font-bold uppercase tracking-[0.24em] ${completed ? "text-neon-green" : "text-neon-red"}`}>
          {completed ? "Destination reached" : "Run ended"}
        </p>
        <h2 className="mt-2 text-3xl font-black text-white">{completed ? "Level complete" : "Vehicle damaged"}</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">
          {completed ? "You reached the destination and secured the route." : "The collision limit was reached."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <Result label="Score" value={snapshot.score.toString()} />
          <Result label="Stars" value={`${snapshot.collectiblesCollected}/${snapshot.totalCollectibles}`} />
        </div>
        {!completed && <p className="mt-4 text-sm font-bold text-white">Hits: {snapshot.collisionsUsed} / {snapshot.maxCollisions}</p>}
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
