"use client";

import { useEffect, useState } from "react";
import type { AuthUser, LeaderboardEntry, ServerScore } from "@/types/auth";
import type { LevelDefinition } from "@/game/state/gameTypes";

interface AccountDashboardProps {
  user: AuthUser | null;
  guestMode: boolean;
  levels: LevelDefinition[];
  refreshKey: number;
  onLogout: () => void;
}

export function AccountDashboard({ user, guestMode, levels, refreshKey, onLogout }: AccountDashboardProps) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scores, setScores] = useState<ServerScore[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leaderboard?level=${selectedLevel}`)
      .then((response) => response.json())
      .then((result: { entries?: LeaderboardEntry[] }) => { if (!cancelled) setLeaderboard(result.entries ?? []); })
      .catch(() => { if (!cancelled) setLeaderboard([]); });
    if (user) {
      fetch("/api/scores/me")
        .then((response) => response.json())
        .then((result: { scores?: ServerScore[] }) => { if (!cancelled) setScores(result.scores ?? []); })
        .catch(() => { if (!cancelled) setScores([]); });
    } else {
      setScores([]);
    }
    return () => { cancelled = true; };
  }, [refreshKey, selectedLevel, user]);

  return (
    <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]" aria-label="Account and leaderboard">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-neon-green">{user ? "Driver account" : "Guest mode"}</p>
            <h2 className="mt-1 text-2xl font-black">{user ? user.username : "Local driver"}</h2>
            <p className="mt-1 text-xs text-white/45">{user ? user.email : "Scores are not submitted globally."}</p>
          </div>
          {user && <button type="button" onClick={onLogout} className="rounded-lg border border-white/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/65 hover:border-white">Log out</button>}
        </div>
        {user ? (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Your best scores</p>
            {scores.length === 0 && <p className="text-sm text-white/55">Complete a level to record your first score.</p>}
            {scores.map((score) => <div key={score.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"><span>Level {score.level}</span><strong className="text-neon-yellow">{score.score}</strong></div>)}
          </div>
        ) : (
          <p className="mt-6 rounded-lg border border-white/10 bg-black/30 p-3 text-sm leading-5 text-white/55">Create an account to keep scores across devices and appear on the global leaderboard.</p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.22em] text-neon-yellow">Global board</p><h2 className="mt-1 text-2xl font-black">Top drivers</h2></div>
          <select value={selectedLevel} onChange={(event) => setSelectedLevel(Number(event.target.value))} className="rounded-lg border border-white/20 bg-black px-3 py-2 text-xs font-bold text-white outline-none"><>{levels.map((level) => <option key={level.level} value={level.level}>Level {level.level}</option>)}</></select>
        </div>
        <div className="mt-5 overflow-x-auto">
          {leaderboard.length === 0 ? <p className="text-sm text-white/50">No submitted scores yet.</p> : <table className="w-full text-left text-xs"><thead className="text-[10px] uppercase tracking-[0.14em] text-white/40"><tr><th className="pb-2">Rank</th><th className="pb-2">Driver</th><th className="pb-2">Score</th><th className="pb-2">Hits</th></tr></thead><tbody>{leaderboard.map((entry) => <tr key={`${entry.rank}-${entry.username}`} className={entry.isCurrentUser ? "text-neon-green" : "text-white/75"}><td className="border-t border-white/10 py-2">{entry.rank}</td><td className="border-t border-white/10 py-2 font-bold">{entry.username}</td><td className="border-t border-white/10 py-2 font-black">{entry.score}</td><td className="border-t border-white/10 py-2">{entry.collisionsUsed}</td></tr>)}</tbody></table>}
        </div>
        {guestMode && <p className="mt-4 text-xs text-white/40">Guest scores are local and do not appear on this board.</p>}
      </div>
    </section>
  );
}
