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

  async function handleOAuth(provider: 'google' | 'discord') {
    setLoading(true);
    setError(null);
    const { error } = await getSupabaseClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
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

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-muted">또는 다음으로 가입</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth("google")}
            className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl border border-border bg-canvas hover:bg-surface text-sm font-medium text-foreground transition-colors"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.04H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth("discord")}
            className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl border border-border bg-[#5865F2] hover:bg-[#4752C4] text-sm font-medium text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            Discord
          </button>
        </div>

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
