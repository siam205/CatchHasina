import type { LevelDefinition, LevelRecord } from "@/game/state/gameTypes";

interface LevelSelectProps {
  levels: LevelDefinition[];
  unlockedLevel: number;
  records: Record<number, LevelRecord>;
  onSelect: (level: LevelDefinition) => void;
}

export function LevelSelect({ levels, unlockedLevel, records, onSelect }: LevelSelectProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_35px_rgba(255,0,60,0.1)] sm:p-8" aria-labelledby="level-select-title">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-neon-green">Route select</p>
        <h2 id="level-select-title" className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Choose your maze.</h2>
        <p className="mt-3 text-sm leading-6 text-white/55">Complete a route to unlock the next level. Results are kept for this session and will be persisted in a later phase.</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {levels.map((level) => {
          const locked = level.level > unlockedLevel;
          const record = records[level.level];

          return (
            <button
              key={level.level}
              type="button"
              disabled={locked}
              onClick={() => onSelect(level)}
              className={`group rounded-2xl border p-5 text-left transition ${locked ? "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-45" : "border-neon-red/40 bg-black hover:border-neon-red hover:shadow-[0_0_22px_rgba(255,0,60,0.24)]"}`}
              aria-label={locked ? `Level ${level.level} locked` : `Select level ${level.level}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Level</p>
                  <p className="mt-1 text-4xl font-black text-white">{level.level}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${locked ? "border-white/20 text-white/45" : "border-neon-green/60 text-neon-green"}`}>
                  {locked ? "Locked" : record ? "Cleared" : "Open"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                <Stat label="Walls" value={level.walls.length.toString()} />
                <Stat label="Targets" value={level.collectibles.length.toString()} />
                <Stat label="Hits" value={level.maxCollisions.toString()} />
                <Stat label="Time" value={formatTime(level.timeLimitSeconds)} />
              </div>

              <div className="mt-5 border-t border-white/10 pt-4 text-xs text-white/50">
                {record ? `Best score ${record.bestScore} | ${record.completions} completion${record.completions === 1 ? "" : "s"}` : "No completion recorded"}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
