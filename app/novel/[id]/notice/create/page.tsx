"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Send } from "lucide-react";
import { createNoticeAction } from "@/app/actions/notice";

export default function NoticeCreatePage() {
  const router = useRouter();
  const params = useParams();
  const novelId = parseInt(params.id as string);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await createNoticeAction({ novelId, title, content });
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
            disabled={pending}
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
