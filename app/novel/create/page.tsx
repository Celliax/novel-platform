"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createNovelAction } from "@/app/actions/novel";
import { getSupabaseClient } from "@/lib/supabase/client";
import TagSelector from "@/components/TagSelector";
import { Tag } from "@/lib/novel-service";
import { CheckCircle, XCircle, Loader2, Camera, ImagePlus } from "lucide-react";

const Editor = dynamic(() => import("@/components/Editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[140px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse" aria-hidden />
  ),
});

function isNextRedirectError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const d = (e as { digest?: string }).digest;
  return typeof d === "string" && d.startsWith("NEXT_REDIRECT");
}

type TitleStatus = "idle" | "checking" | "available" | "taken";

const GENRE_OPTIONS = ["자유판타지", "현대판타지", "무협", "로맨스", "로맨스판타지", "BL", "GL", "일상", "공포/스릴러", "SF", "역사", "스포츠", "기타"];
const AGE_OPTIONS = ["전체이용가", "15세 이용가", "청소년 불가"];

export default function NovelCreatePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("자유판타지");
  const [age, setAge] = useState("전체이용가");
  const [synopsis, setSynopsis] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
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

  // 북커버 이미지 업로드 처리
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // 제목 중복 체크 (디바운스)
  const checkTitle = useCallback(async (value: string) => {
    if (!value.trim()) { setTitleStatus("idle"); return; }
    setTitleStatus("checking");
    try {
      const res = await fetch(`/api/novel/check-title?title=${encodeURIComponent(value.trim())}`);
      const data = await res.json();
      setTitleStatus(data.available ? "available" : "taken");
    } catch { setTitleStatus("idle"); }
  }, []);

  useEffect(() => {
    setTitleStatus("idle");
    if (!title.trim()) return;
    const t = setTimeout(() => checkTitle(title), 400);
    return () => clearTimeout(t);
  }, [title, checkTitle]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (titleStatus === "taken") { setError("이미 같은 제목의 소설이 존재합니다."); return; }
    if (titleStatus === "checking") { setError("제목 중복 확인 중입니다. 잠시 기다려주세요."); return; }
    if (selectedTags.length === 0) { setError("최소 1개의 태그를 선택해주세요."); return; }

    startTransition(async () => {
      try {
        await createNovelAction({
          title,
          genre,
          synopsis,
          tagIds: selectedTags.map(t => t.id),
          coverImage: coverImage || undefined,
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

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-purple-600 font-medium">홈</Link>
          <span>›</span>
          <span className="text-gray-900 font-bold">작품추가</span>
          <span className="text-gray-400 ml-2">✦ 독자이시라면 이는 작품명 및 상세 정보를 입력해주세요.</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Form Header */}
            <div className="px-8 py-5 border-b border-gray-100">
              <h1 className="text-xl font-extrabold text-gray-900">작품설정</h1>
              <p className="text-sm text-gray-500 mt-1">등록하실 작품에 대한 정보를 입력해 주세요.</p>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* LEFT: Cover Preview */}
              <div className="lg:w-72 shrink-0 flex flex-col items-center px-8 py-8 border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-700 mb-4 self-start">관련된 북커버 표지 <span className="text-red-500">*</span></p>

                {/* Cover Preview Box */}
                <div
                  className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-100 flex flex-col items-center justify-center cursor-pointer group hover:border-purple-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {coverImage ? (
                    <>
                      <img src={coverImage} alt="북커버 미리보기" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-white text-center">
                          <Camera size={24} className="mx-auto mb-1" />
                          <p className="text-xs font-bold">커버 변경</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center px-4">
                      <div className="text-gray-400 font-extrabold text-2xl leading-tight mb-2">북커버<br/>준비중</div>
                      <p className="text-xs text-gray-400 mt-3">클릭하여 업로드</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-bold text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ImagePlus size={16} />
                  파일 선택
                </button>
                {coverImage && (
                  <button
                    type="button"
                    onClick={() => setCoverImage(null)}
                    className="mt-2 text-xs text-red-400 hover:text-red-600 font-medium"
                  >
                    커버 제거
                  </button>
                )}
                <p className="text-[10px] text-gray-400 mt-3 text-center leading-relaxed">
                  권장: 400×600 사이즈<br/>이미지 파일 (JPEG/PNG)
                </p>
              </div>

              {/* RIGHT: Form Fields */}
              <div className="flex-1 px-8 py-8 space-y-6">
                {error && (
                  <div className="rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-200 flex items-center gap-2">
                    <XCircle size={15} className="shrink-0" />
                    {error}
                  </div>
                )}

                {/* 작품명 */}
                <div>
                  <label htmlFor="title" className="block text-sm font-bold text-gray-800 mb-2">
                    작품명 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className={`w-full rounded-lg border px-3 py-2.5 pr-9 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors
                        ${titleStatus === "taken" ? "border-red-400 focus:ring-red-100" : ""}
                        ${titleStatus === "available" ? "border-green-400 focus:ring-green-100" : ""}
                        ${titleStatus !== "taken" && titleStatus !== "available" ? "border-gray-300 focus:ring-purple-100 focus:border-purple-400" : ""}
                      `}
                      placeholder="작품명을 입력해주세요."
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {titleStatus === "checking" && <Loader2 size={16} className="text-gray-400 animate-spin" />}
                      {titleStatus === "available" && <CheckCircle size={16} className="text-green-500" />}
                      {titleStatus === "taken" && <XCircle size={16} className="text-red-500" />}
                    </div>
                  </div>
                  {titleStatus === "taken" && <p className="mt-1 text-xs text-red-500 font-medium">이미 사용 중인 작품명입니다.</p>}
                  {titleStatus === "available" && <p className="mt-1 text-xs text-green-600 font-medium">사용 가능한 작품명입니다.</p>}
                </div>

                {/* 분류 & 연령 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="genre" className="block text-sm font-bold text-gray-800 mb-2">
                      분류 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="genre"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                    >
                      {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="age" className="block text-sm font-bold text-gray-800 mb-2">
                      연령 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                    >
                      {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                {/* 태그 */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    태그 <span className="text-red-500">*</span>
                    <span className="ml-1 text-gray-400 font-normal">(최소 1개, 최대 10개 선택)</span>
                  </label>
                  <TagSelector
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    maxTags={10}
                  />
                </div>

                {/* 작품 소개 */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">작품소개</label>
                  <textarea
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    rows={5}
                    placeholder="작품에 대한 소개를 입력해주세요. 독자들이 첫눈에 흥미를 느낄 수 있도록 매력적으로 작성해주세요."
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Link
                    href="/"
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </Link>
                  <button
                    type="submit"
                    disabled={pending || titleStatus === "taken" || titleStatus === "checking"}
                    className="flex items-center gap-2 px-8 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pending ? <><Loader2 size={15} className="animate-spin" />저장 중…</> : "작품등록"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
