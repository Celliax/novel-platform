"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Save, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function AdminNoticePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/notice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, isImportant }),
        });

        if (res.ok) {
          alert("공지사항이 등록되었습니다.");
          router.push("/");
          router.refresh();
        } else {
          const data = await res.json();
          setError(data.error || "등록 실패");
        }
      } catch (err) {
        setError("오류가 발생했습니다.");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 mb-6 hover:text-purple-600 font-bold">
        <ChevronLeft size={16} /> 홈으로 돌아가기
      </Link>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="bg-gray-900 p-8 text-white">
          <Megaphone size={32} className="mb-4 text-purple-400" />
          <h1 className="text-2xl font-black">전체 공지사항 작성</h1>
          <p className="text-gray-400 text-sm mt-2">모든 사용자에게 노출되는 시스템 공지를 작성합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">{error}</div>}

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">공지 제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 시스템 업데이트 안내"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">공지 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="공지 내용을 입력하세요..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 font-medium resize-none"
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600"
            />
            <span className="text-sm font-bold text-gray-700">중요 공지로 표시</span>
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {pending ? "등록 중..." : "공지사항 게시하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
