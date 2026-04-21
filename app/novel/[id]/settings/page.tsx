"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Save, Image as ImageIcon, Settings } from "lucide-react";
import { updateNovelAction } from "@/app/actions/novel";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function NovelSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [ageRating, setAgeRating] = useState("전체 이용가");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [allTags, setAllTags] = useState<{id: number, name: string}[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    try {
      // 1. Tags
      const tagsRes = await fetch("/api/tags");
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAllTags(tagsData.tags);
      }

      // 2. Novel
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
      setTagIds(novel.tags.map((t: any) => t.id));

    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const TARGET_W = 400;
        const ratio = img.height / img.width;
        canvas.width = TARGET_W;
        canvas.height = TARGET_W * ratio;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCoverImage(canvas.toDataURL("image/jpeg", 0.85));
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
        await updateNovelAction(id, {
          title,
          genre,
          synopsis,
          ageRating,
          coverImage: coverImage || undefined,
          tagIds
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "수정에 실패했습니다.");
      }
    });
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
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
              <option value="판타지">판타지</option>
              <option value="로맨스">로맨스</option>
              <option value="무협">무협</option>
              <option value="현대판타지">현대판타지</option>
              <option value="SF">SF</option>
              <option value="미스터리">미스터리</option>
            </select>
          </div>
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
    </div>
  );
}
