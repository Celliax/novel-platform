"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createEpisodeAction } from "@/app/actions/episode";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ChevronLeft, Loader2, Save, BookOpen, Settings } from "lucide-react";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] bg-white animate-pulse" aria-hidden />
  ),
});

function isNextRedirectError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const d = (e as { digest?: string }).digest;
  return typeof d === "string" && d.startsWith("NEXT_REDIRECT");
}

const GUIDE_TEXT = `소설 작성전 안내사항

아직 내용에 해당하는 작품은 운영회의를 통해 수정 권고하거나, 정도가 심할 경우 수정될 수 있습니다.
내용을 확인 한 후 작품 등록 시 손스라이 부탁드립니다.
또한 작품에 대한 모든 권한과 책임은 면제자에게 있습니다.

1. 욕설 비방(특정 인물 또는 단체, 집단을 욕하거나 비방하는) 작품
2. 소아를 성적 대상으로 하는 작품 등 현행법상 문제의 소지가 있는 작품
3. 타인의 근미에 속하는 지적권, 상표권, 의장권 등을 무단으로 침해한 작품
4. 타인의 개인정보(실명, 주민번호, 연락처, 주소, 블로그 주소 등)를 본인의 동의 없이 기억적, 의리적으로 기재한 작품
5. 사이트 운영자의 유리가 있는 작품`;

export default function EpisodeCreatePage() {
  const router = useRouter();
  const params = useParams();
  const novelId = parseInt(params.id as string);

  const [epTitle, setEpTitle] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [chapterNo, setChapterNo] = useState(1);
  const [authorNote, setAuthorNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [novelTitle, setNovelTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuthAndPermission();
  }, []);

  // 5분마다 자동 저장 표시
  useEffect(() => {
    const interval = setInterval(() => {
      setSavedAt(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkAuthAndPermission = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    try {
      const response = await fetch(`/api/novel/${novelId}`);
      if (response.ok) {
        const data = await response.json();
        const novel = data.novel;
        if (novel.authorId === user.id) {
          setIsAuthor(true);
          setChapterNo(novel.episodes.length + 1);
          setNovelTitle(novel.title);
        } else {
          setError("이 작품의 작가만 회차를 추가할 수 있습니다.");
        }
      } else {
        setError("작품을 찾을 수 없습니다.");
      }
    } catch (err) {
      setError("권한 확인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    const text = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    setWordCount(text.length);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const TARGET_W = 800; // 에피소드 이미지는 좀 더 크게
        const ratio = img.height / img.width;
        canvas.width = TARGET_W;
        canvas.height = TARGET_W * ratio;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!epTitle.trim()) { setError("회차 제목을 입력해주세요."); return; }
    if (!content || content === "<p></p>" || content === "<p><br></p>") {
      setError("회차 내용을 입력해주세요."); return;
    }
    startTransition(async () => {
      try {
        await createEpisodeAction({ 
          novelId, 
          chapterNo, 
          title: epTitle.trim(), 
          content,
          image: image || undefined,
          authorNote: authorNote.trim() || undefined
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
        <Loader2 size={32} className="animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isAuthor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-12 rounded-2xl border border-gray-200 shadow-sm max-w-sm">
          <BookOpen size={32} className="text-red-400 mx-auto mb-4" />
          <p className="text-gray-900 text-xl font-extrabold">권한이 없습니다</p>
          <p className="text-gray-500 mt-2 text-sm">이 작품의 작가만 회차를 추가할 수 있습니다.</p>
          <Link href={`/novel/${novelId}`} className="mt-6 inline-block px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition-colors">
            작품으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <form id="episode-form" onSubmit={handleSubmit}>
        {/* ─── Header breadcrumb ─── */}
        <div className="border-b border-gray-200 px-4 py-3 bg-white">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-gray-500 font-medium">
            <Link href={`/novel/${novelId}`} className="hover:text-purple-600 flex items-center gap-1">
              <ChevronLeft size={15} /> {novelTitle || "소설"}
            </Link>
            <span>∷</span>
            <span className="text-gray-900 font-extrabold">새 글 작성하기</span>
          </div>
        </div>

        {/* ─── Episode Title (full-width input) ─── */}
        <div className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
            <input
              value={epTitle}
              onChange={(e) => setEpTitle(e.target.value)}
              placeholder="에피소드 번호를 입력해주세요."
              className="w-full py-4 text-base text-gray-800 placeholder:text-gray-400 bg-transparent focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* ─── Episode Image Upload ─── */}
        <div className="border-b border-gray-100 bg-gray-50/30">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*" 
            />
            {!image ? (
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors font-medium border border-dashed border-gray-300 rounded-lg px-4 py-2 bg-white"
              >
                <Settings size={16} /> 에피소드 삽화 추가하기 (선택)
              </button>
            ) : (
              <div className="relative w-40 aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 group">
                <img src={image} alt="에피소드 삽화" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Settings size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Settings bar ─── */}
        <div className="border-b border-gray-200 bg-gray-50/70">
          <div className="max-w-4xl mx-auto px-4 py-2 flex flex-wrap items-center gap-3">
            <select className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700 font-medium focus:outline-none">
              <option>연재회차</option>
            </select>
            <select className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white text-gray-700 font-medium focus:outline-none">
              <option>전체 열람가능</option>
              <option>구독자 전용</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 font-medium cursor-pointer">
              <input type="checkbox" className="rounded" />
              연재예약
            </label>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <input type="date" className="border border-gray-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none" />
              <select className="border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none">
                {Array.from({length:24},(_,i)=><option key={i}>{i}시</option>)}
              </select>
              <select className="border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none">
                <option>0분</option><option>30분</option>
              </select>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link href={`/novel/${novelId}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                <Settings size={13} /> 작품설정
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Author info row ─── */}
        <div className="border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3 text-xs text-gray-500">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="indent" defaultChecked className="accent-purple-600" />
              <span className="font-medium">문단글</span>
            </label>
            <select className="border border-gray-300 rounded px-2 py-1 bg-white text-xs focus:outline-none text-gray-700 font-medium">
              <option>큰폰 들여쓰기</option>
              <option>일반 들여쓰기</option>
              <option>들여쓰기 없음</option>
            </select>
            <span className="text-gray-700 font-extrabold ml-1">작가명</span>
            <span className="ml-auto text-gray-400">{wordCount.toLocaleString()}자</span>
          </div>
        </div>

        {/* ─── Error ─── */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 mt-3">
            <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-200">{error}</div>
          </div>
        )}

        {/* ─── Editor area ─── */}
        <div className="max-w-4xl mx-auto px-4 py-6 min-h-[60vh]">
          <Editor value={content} onChange={handleContentChange} />
        </div>

        {/* ─── Auto-save notice & bottom bar ─── */}
        <div className="border-t border-gray-200 bg-gray-50/60">
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
            <span>
              {savedAt
                ? `${savedAt} 자동 저장 되었습니다.`
                : "5분 타이머 자동 저장 되고 있습니다."}
            </span>
            <span>전체 글자수 : {wordCount.toLocaleString()}자</span>
          </div>
        </div>

        {/* ─── Author note ─── */}
        <div className="border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <label className="block text-xs font-extrabold text-gray-600 mb-2">
              작가글 <span className="font-normal text-gray-400">[작가만]</span>
            </label>
            <textarea
              value={authorNote}
              onChange={(e) => setAuthorNote(e.target.value)}
              rows={3}
              placeholder="독자분들에게 남기고 싶은 말을 작성해주세요. (선택)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 resize-none"
            />
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded accent-purple-600" />
                자동저장공지
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded accent-purple-600" />
                댓글공지
              </label>
              <div className="ml-auto flex gap-2">
                <Link
                  href={`/novel/${novelId}`}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {pending ? "저장 중…" : "작성완료"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}