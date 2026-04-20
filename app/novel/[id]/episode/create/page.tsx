"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createEpisodeAction } from "@/app/actions/episode";
import { getSupabaseClient } from "@/lib/supabase/client";
import { BookOpen, ChevronLeft, Loader2, Save } from "lucide-react";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[60vh] rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
      aria-hidden
    />
  ),
});

function isNextRedirectError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const d = (e as { digest?: string }).digest;
  return typeof d === "string" && d.startsWith("NEXT_REDIRECT");
}

type NovelInfo = {
  title: string;
  episodeCount: number;
};

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
  const [novelInfo, setNovelInfo] = useState<NovelInfo | null>(null);
  const [wordCount, setWordCount] = useState(0);

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
    try {
      const response = await fetch(`/api/novel/${novelId}`);
      if (response.ok) {
        const data = await response.json();
        const novel = data.novel;
        if (novel.authorId === user.id) {
          setIsAuthor(true);
          const nextChapterNo = novel.episodes.length + 1;
          setChapterNo(nextChapterNo);
          setNovelInfo({ title: novel.title, episodeCount: novel.episodes.length });
        } else {
          setError("이 작품의 작가만 회차를 추가할 수 있습니다.");
        }
      } else {
        setError("작품을 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("권한 확인 실패:", err);
      setError("권한 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // content 변경 시 글자 수 계산
  const handleContentChange = (value: string) => {
    setContent(value);
    // HTML 태그 제거 후 글자 수 계산
    const text = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
    setWordCount(text.length);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("회차 제목을 입력해주세요.");
      return;
    }
    if (!content || content === "<p></p>" || content === "<p><br></p>") {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-12 rounded-2xl border border-gray-200 shadow-sm max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-red-400" />
          </div>
          <p className="text-gray-900 text-xl font-extrabold">권한이 없습니다</p>
          <p className="text-gray-500 mt-2 text-sm">이 작품의 작가만 회차를 추가할 수 있습니다.</p>
          <Link
            href={`/novel/${novelId}`}
            className="mt-6 inline-block px-6 py-3 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition-colors"
          >
            작품으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/novel/${novelId}`}
              className="shrink-0 flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors"
            >
              <ChevronLeft size={18} />
              <span className="hidden sm:inline">목록으로</span>
            </Link>
            <div className="h-5 w-px bg-gray-200 shrink-0" />
            {novelInfo && (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-extrabold text-gray-900 truncate">{novelInfo.title}</span>
                <span className="shrink-0 px-2 py-0.5 bg-purple-100 text-purple-700 text-[11px] font-extrabold rounded tracking-wider">
                  EP.{chapterNo}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:block text-xs font-medium text-gray-400">{wordCount.toLocaleString()}자</span>
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById("episode-form") as HTMLFormElement;
                form?.requestSubmit();
              }}
              disabled={pending}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-lg transition-colors disabled:opacity-60 shadow-sm"
            >
              {pending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  저장 중
                </>
              ) : (
                <>
                  <Save size={15} />
                  연재하기
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form id="episode-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-200 font-medium" role="alert">
              {error}
            </div>
          )}

          {/* Episode Meta Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {/* 회차 번호 */}
              <div>
                <label htmlFor="chapterNo" className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
                  회차 번호
                </label>
                <input
                  id="chapterNo"
                  name="chapterNo"
                  type="number"
                  value={chapterNo}
                  onChange={(e) => setChapterNo(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
                />
              </div>

              {/* 회차 제목 */}
              <div className="col-span-2 sm:col-span-3">
                <label htmlFor="ep-title" className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">
                  회차 제목
                </label>
                <input
                  id="ep-title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-colors"
                  placeholder={`예: 제${chapterNo}화 — 시작`}
                />
              </div>
            </div>
          </div>

          {/* Editor Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-extrabold text-gray-700">회차 내용</span>
              <span className="text-xs font-medium text-gray-400">{wordCount.toLocaleString()}자 작성됨</span>
            </div>
            <div className="p-2 sm:p-4">
              <Editor value={content} onChange={handleContentChange} />
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
            <Link
              href={`/novel/${novelId}`}
              className="inline-flex justify-center rounded-xl px-6 py-3 text-sm font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              취소하고 돌아가기
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex justify-center items-center gap-2 rounded-xl px-8 py-3 text-sm font-extrabold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  저장 중…
                </>
              ) : (
                <>
                  <Save size={16} />
                  연재하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}