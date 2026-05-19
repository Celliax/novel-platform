"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateEpisodeAction } from "@/app/actions/episode";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ChevronLeft, Loader2, Save, BookOpen, Settings } from "lucide-react";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[60vh] bg-surface animate-pulse" aria-hidden />
  ),
});

function isNextRedirectError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const d = (e as { digest?: string }).digest;
  return typeof d === "string" && d.startsWith("NEXT_REDIRECT");
}

export default function EpisodeEditPage() {
  const router = useRouter();
  const params = useParams();
  const novelId = parseInt(params.id as string);
  const episodeId = parseInt(params.eid as string);

  const [epTitle, setEpTitle] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [chapterNo, setChapterNo] = useState(1);
  const [authorNote, setAuthorNote] = useState("");
  const [isSideStory, setIsSideStory] = useState(false);
  const [isAdultOnly, setIsAdultOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [novelTitle, setNovelTitle] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEpisodeData();
  }, [novelId, episodeId]);

  const loadEpisodeData = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    try {
      // 1. Fetch novel for title and author check
      const novelRes = await fetch(`/api/novel/${novelId}`);
      if (!novelRes.ok) throw new Error("작품을 찾을 수 없습니다.");
      const novelData = await novelRes.json();
      const novel = novelData.novel;
      
      if (novel.authorId !== user.id) {
        setError("수정 권한이 없습니다.");
        setLoading(false);
        return;
      }

      setIsAuthor(true);
      setNovelTitle(novel.title);

      // 2. Fetch full episode data (including content)
      const epRes = await fetch(`/api/novel/${novelId}/episode/${episodeId}`);
      if (!epRes.ok) throw new Error("회차를 찾을 수 없습니다.");
      const epData = await epRes.json();
      const ep = epData.episode;

      setEpTitle(ep.title);
      setContent(ep.content);
      setChapterNo(ep.chapterNo);
      setAuthorNote(ep.authorNote || "");
      setIsSideStory(ep.isSideStory || false);
      setIsAdultOnly(ep.isAdultOnly || false);
      setImage(ep.image || null);
      
      const text = (ep.content || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
      setWordCount(text.length);

    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    const text = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    setWordCount(text.length);
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "image/gif") {
      alert("GIF 이미지는 업로드할 수 없습니다.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const TARGET_W = 800;
        const ratio = img.height / img.width;
        canvas.width = TARGET_W;
        canvas.height = TARGET_W * ratio;
        const ctx = canvas.getContext("2d");

        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        if (outputType === "image/jpeg") {
          ctx!.fillStyle = "white";
          ctx!.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (!blob) { setIsUploading(false); return; }
          const extension = outputType === "image/png" ? ".png" : ".jpg";
          const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + extension, { type: outputType });
          
          try {
            const { uploadImage } = await import("@/lib/storage");
            const url = await uploadImage(resizedFile);
            setImage(url);
          } catch (err) {
            console.error(err);
            alert("이미지 업로드 실패: " + (err instanceof Error ? err.message : "알 수 없는 오류"));
          } finally {
            setIsUploading(false);
          }
        }, outputType, 0.85);
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
        let finalImage = image;
        // 기존 Base64 이미지가 있다면 Cloudinary로 먼저 업로드
        if (image && image.startsWith("data:image")) {
          const { uploadBase64Image } = await import("@/lib/storage");
          finalImage = await uploadBase64Image(image);
        }

        await updateEpisodeAction({ 
          id: episodeId,
          novelId, 
          title: epTitle.trim(), 
          content,
          image: finalImage || undefined,
          authorNote: authorNote.trim() || undefined,
          isSideStory: isSideStory,
          isAdultOnly: isAdultOnly
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
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (error && !isAuthor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-canvas">
        <div className="text-center bg-surface p-12 rounded-2xl border border-border shadow-card max-w-sm">
          <BookOpen size={32} className="text-red-400 mx-auto mb-4" />
          <p className="text-foreground text-xl font-extrabold">에러 발생</p>
          <p className="text-muted mt-2 text-sm">{error}</p>
          <Link href={`/novel/${novelId}`} className="mt-6 inline-block px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 transition-colors">
            작품으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <form id="episode-form" onSubmit={handleSubmit}>
        <div className="border-b border-border px-4 py-3 bg-surface">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-muted font-medium">
            <Link href={`/novel/${novelId}`} className="hover:text-brand-600 flex items-center gap-1">
              <ChevronLeft size={15} /> {novelTitle || "소설"}
            </Link>
            <span>∷</span>
            <span className="text-foreground font-extrabold">회차 수정하기</span>
          </div>
        </div>

        <div className="border-b border-border">
          <div className="max-w-4xl mx-auto px-4">
            <input
              value={epTitle}
              onChange={(e) => setEpTitle(e.target.value)}
              placeholder="회차 제목을 입력해주세요."
              className="w-full py-4 text-base text-foreground/90 placeholder:text-muted/80 bg-transparent focus:outline-none font-medium"
            />
          </div>
        </div>

        <div className="border-b border-border bg-canvas/30">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
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
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm text-muted hover:text-brand-600 transition-colors font-medium border border-dashed border-border/80 rounded-lg px-4 py-2 bg-surface disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
                  {isUploading ? "업로드 중..." : "메인 삽화 설정 (선택)"}
                </button>
              ) : (
                <div className="relative w-40 aspect-[4/3] rounded-lg overflow-hidden border border-border group">
                  <img src={image} alt="메인 삽화" className="w-full h-full object-cover" />
                  {isUploading && (
                    <div className="absolute inset-0 bg-surface/60 flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-brand-600" />
                    </div>
                  )}
                  <button 
                    type="button"
                    disabled={isUploading}
                    onClick={() => setImage(null)}
                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
                  >
                    <Settings size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-brand-600 font-bold cursor-pointer bg-brand-50 px-2 py-1 rounded-md border border-brand-100">
                <input 
                  type="checkbox" 
                  checked={isSideStory}
                  onChange={(e) => setIsSideStory(e.target.checked)}
                  className="rounded accent-purple-600" 
                />
                외전으로 등록
              </label>
              <label className="flex items-center gap-1.5 text-xs text-red-600 font-bold cursor-pointer bg-red-50 px-2 py-1 rounded-md border border-red-100">
                <input 
                  type="checkbox" 
                  checked={isAdultOnly}
                  onChange={(e) => setIsAdultOnly(e.target.checked)}
                  className="rounded accent-red-600" 
                />
                19세 이용가(성인)
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto px-4 mt-3">
            <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-200">{error}</div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-6 min-h-[60vh]">
          <Editor value={content} onChange={handleContentChange} />
        </div>

        <div className="border-t border-border">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <label className="block text-xs font-extrabold text-muted mb-2">
              작가글 <span className="font-normal text-muted/80">[작가만]</span>
            </label>
            <textarea
              value={authorNote}
              onChange={(e) => setAuthorNote(e.target.value)}
              rows={3}
              placeholder="독자분들에게 남기고 싶은 말을 작성해주세요. (선택)"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-foreground/90 bg-surface placeholder:text-muted/80 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-600 resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <Link
                href={`/novel/${novelId}`}
                className="px-5 py-2.5 border border-border/80 rounded-lg text-sm font-bold text-muted hover:bg-canvas transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm rounded-lg transition-colors shadow-card disabled:opacity-50"
              >
                {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {pending ? "수정 중…" : "수정완료"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
