"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Send, ImagePlus, X } from "lucide-react";
import { createNoticeAction } from "@/app/actions/notice";
import { uploadToCloudinaryAction } from "@/app/actions/storage";

export default function NoticeCreatePage() {
  const router = useRouter();
  const params = useParams();
  const novelId = parseInt(params.id as string);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // 이미지 관련 상태
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 미리보기용 Data URL 생성
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      setImagePreview(dataUrl);
      setImageUploading(true);
      setError(null);

      try {
        const result = await uploadToCloudinaryAction(dataUrl);
        if (result.success && result.url) {
          setUploadedImageUrl(result.url);
        } else {
          setError(result.error || "이미지 업로드에 실패했습니다.");
          setImagePreview(null);
        }
      } catch {
        setError("이미지 업로드 중 오류가 발생했습니다.");
        setImagePreview(null);
      } finally {
        setImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setUploadedImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    if (imageUploading) {
      setError("이미지 업로드 중입니다. 잠시만 기다려주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await createNoticeAction({
          novelId,
          title,
          content,
          image: uploadedImageUrl || undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "공지 등록 실패");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/novel/${novelId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">작가 공지 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-sm font-extrabold text-gray-700 mb-2">공지 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지사항 제목을 입력하세요."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-extrabold text-gray-700 mb-2">공지 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="공지할 내용을 작성하세요."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none transition-all"
          />
        </div>

        {/* 이미지 첨부 섹션 */}
        <div>
          <label className="block text-sm font-extrabold text-gray-700 mb-2">
            이미지 첨부 <span className="font-normal text-gray-400">(선택)</span>
          </label>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              {/* 미리보기 이미지 */}
              <img
                src={imagePreview}
                alt="첨부 이미지 미리보기"
                className="w-full max-h-80 object-contain"
              />
              {/* 업로드 중 오버레이 */}
              {imageUploading && (
                <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={28} className="animate-spin text-purple-600" />
                  <span className="text-sm font-bold text-purple-600">업로드 중…</span>
                </div>
              )}
              {/* 삭제 버튼 */}
              {!imageUploading && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                  aria-label="이미지 제거"
                >
                  <X size={16} />
                </button>
              )}
              {/* 업로드 완료 뱃지 */}
              {!imageUploading && uploadedImageUrl && (
                <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  ✓ 업로드 완료
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-purple-300 hover:bg-purple-50/30 transition-all group"
            >
              <ImagePlus size={28} className="text-gray-300 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm font-bold text-gray-400 group-hover:text-purple-500 transition-colors">
                클릭하여 이미지 첨부
              </span>
              <span className="text-xs text-gray-300">JPG, PNG, GIF, WebP 지원</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={pending || imageUploading}
            className="flex-1 py-4 bg-gray-900 hover:bg-black text-white font-extrabold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {pending ? "등록 중…" : "공지 등록"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 font-medium text-center">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

