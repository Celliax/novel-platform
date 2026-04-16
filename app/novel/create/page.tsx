"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createNovelAction } from "@/app/actions/novel";
import { getSupabaseClient } from "@/lib/supabase/client";
import TagSelector from "@/components/TagSelector";
import { Tag } from "@/lib/novel-service";

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
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [synopsis, setSynopsis] = useState("<p></p>");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(false);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedTags.length === 0) {
      setError("최소 1개의 태그를 선택해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await createNovelAction({
          title,
          genre,
          synopsis,
          tagIds: selectedTags.map(tag => tag.id),
        });
      } catch (err) {
        if (isNextRedirectError(err)) throw err;
        setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      }
    });
  }

  if (loading) {
    return (
      <div className="hero-gradient flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">로딩 중...</p>
        </div>
      </div>
    );
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
            <label className="block text-sm font-medium text-foreground mb-2">
              태그 (최소 1개, 최대 10개)
            </label>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              maxTags={10}
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
