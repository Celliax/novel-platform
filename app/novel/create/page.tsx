"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createNovelAction } from "@/app/actions/novel";
import { getSupabaseClient } from "@/lib/supabase/client";
import TagSelector from "@/components/TagSelector";
import { Tag } from "@/lib/novel-service";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

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

type TitleStatus = "idle" | "checking" | "available" | "taken";

export default function NovelCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [synopsis, setSynopsis] = useState("<p></p>");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [titleStatus, setTitleStatus] = useState<TitleStatus>("idle");

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

  // 제목 중복 체크 (디바운스 300ms)
  const checkTitle = useCallback(async (value: string) => {
    if (!value.trim()) {
      setTitleStatus("idle");
      return;
    }
    setTitleStatus("checking");
    try {
      const res = await fetch(`/api/novel/check-title?title=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      setTitleStatus(data.available ? "available" : "taken");
    } catch {
      setTitleStatus("idle");
    }
  }, []);

  useEffect(() => {
    setTitleStatus("idle");
    if (!title.trim()) return;
    const timer = setTimeout(() => checkTitle(title), 400);
    return () => clearTimeout(timer);
  }, [title, checkTitle]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (titleStatus === "taken") {
      setError("이미 같은 제목의 소설이 존재합니다. 다른 제목을 사용해주세요.");
      return;
    }
    if (titleStatus === "checking") {
      setError("제목 중복 확인 중입니다. 잠시 기다려주세요.");
      return;
    }
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
          ← 홈으로
        </Link>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          새 소설 등록
        </h1>
        <p className="mt-2 text-gray-500 text-sm">
          작품 정보를 입력하고 소설을 등록해보세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-200 flex items-center gap-2" role="alert">
            <XCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* 작품 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-gray-800 mb-2">
              작품 제목 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={`w-full rounded-xl border px-4 py-3 pr-10 text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors
                  ${titleStatus === "taken" ? "border-red-400 focus:ring-red-200" : ""}
                  ${titleStatus === "available" ? "border-green-400 focus:ring-green-200" : ""}
                  ${titleStatus === "idle" || titleStatus === "checking" ? "border-gray-200 focus:ring-purple-100 focus:border-purple-400" : ""}
                `}
                placeholder="예: 별이 내리는 서점"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {titleStatus === "checking" && <Loader2 size={18} className="text-gray-400 animate-spin" />}
                {titleStatus === "available" && <CheckCircle size={18} className="text-green-500" />}
                {titleStatus === "taken" && <XCircle size={18} className="text-red-500" />}
              </div>
            </div>
            {titleStatus === "taken" && (
              <p className="mt-1.5 text-xs font-medium text-red-500">이미 사용 중인 제목입니다.</p>
            )}
            {titleStatus === "available" && (
              <p className="mt-1.5 text-xs font-medium text-green-600">사용 가능한 제목입니다.</p>
            )}
          </div>

          {/* 장르 */}
          <div>
            <label htmlFor="genre" className="block text-sm font-bold text-gray-800 mb-2">
              장르 <span className="text-red-500">*</span>
            </label>
            <input
              id="genre"
              name="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-colors"
              placeholder="예: 판타지, 로맨스, 현대"
            />
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              태그 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(최소 1개, 최대 10개)</span>
            </label>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              maxTags={10}
            />
          </div>

          {/* 작품 소개 */}
          <div>
            <span className="block text-sm font-bold text-gray-800 mb-2">
              작품 소개 <span className="text-gray-400 font-normal">(선택)</span>
            </span>
            <Editor value={synopsis} onChange={setSynopsis} />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex justify-center rounded-xl px-6 py-3 text-sm font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={pending || titleStatus === "taken" || titleStatus === "checking"}
            className="inline-flex justify-center items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                저장 중…
              </>
            ) : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
