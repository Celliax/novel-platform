"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Save, Image as ImageIcon, Trash2, AlertTriangle } from "lucide-react";
import { updateNovelAction, deleteNovelAction } from "@/app/actions/novel";
import { getSupabaseClient } from "@/lib/supabase/client";
import TagSelector from "@/components/TagSelector";
import { Tag } from "@/lib/types";

const GENRE_OPTIONS = ["자유판타지", "현대판타지", "무협", "로맨스", "로맨스판타지", "BL", "GL", "일상", "공포/스릴러", "SF", "역사", "스포츠", "기타"];
const AGE_OPTIONS = ["전체 이용가", "15세 이용가", "19세 이용가"];

export default function NovelSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [ageRating, setAgeRating] = useState("전체 이용가");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function isNextRedirectError(e: unknown): boolean {
    if (typeof e !== "object" || e === null) return false;
    const d = (e as { digest?: string }).digest;
    return typeof d === "string" && d.startsWith("NEXT_REDIRECT");
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    try {
      // Novel (Tags are included in novel data)
      const novelRes = await fetch(`/api/novel/${id}`);
      if (!novelRes.ok) throw new Error("작품을 찾을 수 없습니다.");
      const novelData = await novelRes.json();
      const novel = novelData.novel;

      if (novel.authorId !== user.id) {
        router.push(`/novel/${id}`);
        return;
      }

      setTitle(novel.title);
      setGenre(novel.genre);
      setSynopsis(novel.synopsis);
      setAgeRating(novel.ageRating);
      setCoverImage(novel.coverImage);
      setSelectedTags(novel.tags || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
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
        const TARGET_W = 400;
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
            setCoverImage(url);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        let finalCover = coverImage;
        // 기존 Base64 이미지가 있다면 Cloudinary로 먼저 업로드
        if (coverImage && coverImage.startsWith("data:image")) {
          const { uploadBase64Image } = await import("@/lib/storage");
          finalCover = await uploadBase64Image(coverImage);
        }

        await updateNovelAction(id, {
          title,
          genre,
          synopsis,
          ageRating,
          coverImage: finalCover || undefined,
          tagIds: selectedTags.map(t => t.id)
        });
      } catch (err) {
        if (isNextRedirectError(err)) throw err;
        setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
      }
    });
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== title) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteNovelAction(id);
    } catch (err: any) {
      if (isNextRedirectError(err)) throw err;
      setDeleteError(err.message || "삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/novel/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">작품 설정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        {/* Cover Image Section */}
        <div>
          <label className="block text-sm font-extrabold text-gray-700 mb-4">작품 표지</label>
          <div className="flex items-start gap-6">
            <div className="relative w-40 aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
              {coverImage ? (
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                  <ImageIcon size={32} className="text-gray-300" />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-purple-600" />
                </div>
              )}
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isUploading ? 'pointer-events-none' : ''}`}
              >
                <span className="text-white text-xs font-bold">변경하기</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-gray-500 font-medium">표지는 작품의 첫인상입니다.</p>
              <p className="text-xs text-gray-400">추천 사이즈: 600x800 (3:4 비율)</p>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sm text-purple-600 font-bold hover:underline"
              >
                파일 선택하기
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className="hidden" 
                accept="image/*" 
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-extrabold text-gray-700 mb-2">작품 제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-extrabold text-gray-700 mb-2">장르</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none bg-white transition-all"
            >
              {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-extrabold text-gray-700 mb-2">연령 등급</label>
          <select
            value={ageRating}
            onChange={(e) => setAgeRating(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none bg-white transition-all"
          >
            {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-extrabold text-gray-700 mb-2">태그</label>
          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            maxTags={10}
          />
        </div>

        <div>
          <label className="block text-sm font-extrabold text-gray-700 mb-2">줄거리</label>
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            rows={5}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none transition-all"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push(`/novel/${id}`)}
            className="flex-1 py-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {pending ? "저장 중…" : "수정 완료"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}
      </form>

      {/* Danger Zone */}
      <div className="mt-10 bg-white border border-red-100 rounded-2xl p-8 shadow-sm">
        <h2 className="text-base font-extrabold text-red-600 mb-1 flex items-center gap-2">
          <AlertTriangle size={18} />
          위험 구역
        </h2>
        <p className="text-sm text-gray-400 mb-5">
          아래 작업은 되돌릴 수 없습니다. 신중하게 진행해주세요.
        </p>
        <button
          type="button"
          onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(""); setDeleteError(null); }}
          className="flex items-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-colors border border-red-200"
        >
          <Trash2 size={16} />
          이 작품 삭제하기
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">작품 삭제</h3>
                <p className="text-xs text-gray-400">이 작업은 되돌릴 수 없습니다</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-1">
              삭제 시 <strong>모든 회차, 댓글, 선호작, 별점, 공지</strong> 등 관련 데이터가 함께 삭제됩니다.
            </p>
            <p className="text-sm text-gray-600 mb-5">
              계속하려면 아래에 작품 제목 <strong className="text-red-600 break-all">'{title}'</strong>을 입력하세요.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="작품 제목 입력"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all"
              disabled={isDeleting}
            />

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText !== title || isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-extrabold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isDeleting ? (
                  <><Loader2 size={16} className="animate-spin" /> 삭제 중…</>
                ) : (
                  <><Trash2 size={16} /> 완전히 삭제</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
