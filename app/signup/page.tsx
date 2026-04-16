"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login?verified=1` : undefined;

    const { error: signUpError } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { nickname: name.trim() },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setMessage("인증 메일을 보냈습니다. 이메일에서 인증 후 로그인해주세요.");
    setLoading(false);
  }

  return (
    <div className="hero-gradient flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-card-hover ring-1 ring-border/60">
        <h1 className="text-2xl font-bold text-foreground text-center">회원가입</h1>
        <p className="mt-2 text-sm text-muted text-center">
          이메일 인증 후 계정이 활성화됩니다.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              닉네임
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="nickname"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              placeholder="필명 또는 닉네임"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              placeholder="8자 이상"
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 text-red-700 px-3 py-2 text-sm" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">{message}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 text-white font-medium py-3 hover:bg-brand-700 transition-colors shadow-card"
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
