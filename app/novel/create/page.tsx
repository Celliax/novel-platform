"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition } from "react";
import { createNovelAction } from "@/app/actions/novel";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[24rem] rounded-xl border border-border bg-muted/40 animate-pulse"
      aria-hidden
    />
  ),
});

function isNextRedirectError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const d = (e as { digest?: string }).digest;
  return typeof d === "string" && d.startsWith("NEXT_REDIRECT");
}

export default function NovelCreatePage() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [synopsis, setSynopsis] = useState("<p></p>");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createNovelAction({
          title,
          genre,
          synopsis,
          author: author.trim() || undefined,
        });
      } catch (err) {
        if (isNextRedirectError(err)) throw err;
        setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-8">
        <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          ← 홈으로
        </Link>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          새 소설 등록
        </h1>
        <p className="mt-2 text-muted text-sm sm:text-base">
          작품 소개는 에디터로 작성합니다. 본문 에피소드는 이후 작성 화면에서 추가할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div
            className="rounded-xl bg-red-50 text-red-800 text-sm px-4 py-3 ring-1 ring-red-200"
            role="alert"
          >
            {error}
          </div>
        )}
        <div className="rounded-2xl bg-surface p-6 sm:p-8 shadow-card ring-1 ring-border/60 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              작품 제목
            </label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              placeholder="예: 별이 내리는 서점"
            />
          </div>
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-foreground mb-2">
              작가명 (비워 두면 &quot;익명&quot;)
            </label>
            <input
              id="author"
              name="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              placeholder="필명"
            />
          </div>
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-foreground mb-2">
              장르
            </label>
            <input
              id="genre"
              name="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              placeholder="예: 판타지, 로맨스"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-foreground mb-2">작품 소개</span>
            <Editor value={synopsis} onChange={setSynopsis} />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Link
            href="/"
            className="inline-flex justify-center rounded-xl px-5 py-3 text-sm font-medium ring-1 ring-border bg-surface hover:bg-canvas transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-xl px-5 py-3 text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-card disabled:opacity-60"
          >
            {pending ? "저장 중…" : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
