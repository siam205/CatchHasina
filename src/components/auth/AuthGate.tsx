"use client";

import { useState } from "react";
import Image from "next/image";
import type { AuthUser } from "@/types/auth";

interface AuthGateProps {
  onAuthenticated: (user: AuthUser) => void;
  onGuest: () => void;
}

type AuthMode = "login" | "signup";

export function AuthGate({ onAuthenticated, onGuest }: AuthGateProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const result = await response.json() as { user?: AuthUser; error?: string };
      if (!response.ok || !result.user) throw new Error(result.error ?? "Authentication failed.");
      onAuthenticated(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_0_45px_rgba(255,0,60,0.15)]">
      <div className="absolute inset-0 bg-[#8fc8ed]">
        <Image src="/images/auth-background.webp" alt="" fill priority sizes="100vw" className="object-contain object-center opacity-90 sm:object-left" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.12),rgba(0,0,0,0.5),rgba(0,0,0,0.92))]" />
      <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-end p-5 sm:p-10">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-black/75 p-6 shadow-[0_0_35px_rgba(0,0,0,0.65)] backdrop-blur-md sm:p-8" aria-labelledby="auth-title">
          <h1 id="auth-title" className="text-4xl font-black tracking-tight text-white">Catch Hasina</h1>
          <p className="mt-3 text-lg font-bold text-white/80">Can You Catch Her?</p>

          <div className="mt-6 grid grid-cols-2 rounded-xl border border-white/10 bg-white/5 p-1">
            <button type="button" onClick={() => { setMode("login"); setError(""); }} className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${mode === "login" ? "bg-neon-green text-black" : "text-white/55"}`}>Log in</button>
            <button type="button" onClick={() => { setMode("signup"); setError(""); }} className={`rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${mode === "signup" ? "bg-neon-green text-black" : "text-white/55"}`}>Sign up</button>
          </div>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {mode === "signup" && <Field label="Username" value={username} onChange={setUsername} placeholder="neon_driver" minLength={3} />}
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="At least 8 characters" type="password" minLength={8} />
            {mode === "signup" && <Field label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat your password" type="password" minLength={8} />}
            {error && <p className="rounded-lg border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-neon-green px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_0_18px_rgba(57,255,20,0.35)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50">
              {loading ? "Working..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
          <button type="button" onClick={onGuest} className="w-full rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:border-white">Play as guest</button>
          <p className="mt-4 text-center text-xs leading-5 text-white/40">Guest progress stays on this device. Sign in to submit scores to the leaderboard.</p>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", minLength }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; minLength?: number }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/55">{label}</span>
      <input required type={type} value={value} minLength={minLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-neon-green" />
    </label>
  );
}
