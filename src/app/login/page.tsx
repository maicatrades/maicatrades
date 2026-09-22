"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("The email or password is incorrect.");
      setLoading(false);
      return;
    }

    window.location.assign("/pro");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030706] px-5 py-12 text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(16,185,129,.16),transparent_36%)]" />
      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#07100d]/95 p-7 shadow-2xl shadow-black/50 sm:p-9">
        <div className="flex items-center gap-3">
          <Image src="/maica-logo.png" alt="MaicaTrades" width={48} height={48} priority />
          <div>
            <div className="text-xl font-black">
              Maica<span className="text-emerald-400">Trades</span>
            </div>
            <div className="mt-1 text-[10px] font-black tracking-[.34em] text-emerald-400">
              PRIVATE PRO
            </div>
          </div>
        </div>

        <div className="mt-9">
          <p className="text-xs font-bold uppercase tracking-[.28em] text-emerald-400">
            Secure access
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Welcome back.</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Sign in to open your private market decision desk.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[.18em] text-zinc-400">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm outline-none transition placeholder:text-zinc-700 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[.18em] text-zinc-400">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm outline-none transition placeholder:text-zinc-700 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
              placeholder="Enter your password"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-black text-[#03100b] transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Open Private Pro"}
          </button>
        </form>

        <p className="mt-7 text-center text-xs text-zinc-600">
          Depth without complexity.
        </p>
      </section>
    </main>
  );
}
