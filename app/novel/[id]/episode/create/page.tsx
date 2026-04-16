"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createEpisodeAction } from "@/app/actions/episode";
import { getSupabaseClient } from "@/lib/supabase/client";

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

export default function EpisodeCreatePage() {
  const router = useRouter();
  const params = useParams();
  const novelId = parseInt(params.id as string);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [chapterNo, setChapterNo] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);

  useEffect(() => {
    checkAuthAndPermission();
  }, []);

  const checkAuthAndPermission = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // 작품의 작가인지 확인
    try {
      const response = await fetch(`/api/novel/${novelId}`);
      if (response.ok) {
        const novel = await response.json();
        if (novel.authorId === user.id) {
          setIsAuthor(true);
          // 다음 회차 번호 계산
          const nextChapterNo = novel.episodes.length + 1;
          setChapterNo(nextChapterNo);
        } else {
          setError("이 작품의 작가만 회차를 추가할 수 있습니다.");
        }
      } else {
        setError("작품을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("권한 확인 실패:", error);
      setError("권한 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("회차 제목을 입력해주세요.");
      return;
    }

    if (!content || content === "<p></p>") {
      setError("회차 내용을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await createEpisodeAction({
          novelId,
          chapterNo,
          title: title.trim(),
          content,
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

  if (!isAuthor) {
    return (
      <div className="hero-gradient flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-white text-xl">권한이 없습니다.</p>
          <p className="text-white mt-2">이 작품의 작가만 회차를 추가할 수 있습니다.</p>
          <Link href={`/novel/${novelId}`} className="mt-4 inline-block text-blue-300 hover:text-blue-100">
            작품으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      <div className="mb-8">
        <Link href={`/novel/${novelId}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
          ← 작품으로 돌아가기
        </Link>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          새 회차 등록
        </h1>
        <p className="mt-2 text-muted text-sm sm:text-base">
          회차 제목과 내용을 입력해주세요.
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
            <label htmlFor="chapterNo" className="block text-sm font-medium text-foreground mb-2">
              회차 번호
            </label>
            <input
              id="chapterNo"
              name="chapterNo"
              type="number"
              value={chapterNo}
              onChange={(e) => setChapterNo(parseInt(e.target.value) || 1)}
              min={1}
              className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              회차 제목
            </label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              placeholder="예: 제1화 - 시작"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-foreground mb-2">회차 내용</span>
            <Editor value={content} onChange={setContent} />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Link
            href={`/novel/${novelId}`}
            className="inline-flex justify-center rounded-xl px-5 py-3 text-sm font-medium ring-1 ring-border bg-surface hover:bg-canvas transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center rounded-xl px-5 py-3 text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-card disabled:opacity-60"
          >
            {pending ? "저장 중…" : "연재하기"}
          </button>
        </div>
      </form>
    </div>
  );
}