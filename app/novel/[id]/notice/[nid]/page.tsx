"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, AlertCircle, Calendar, Eye } from "lucide-react";

export default function NoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const novelId = parseInt(params.id as string);
  const noticeId = parseInt(params.nid as string);

  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { getSupabaseClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
    loadNotice();
  }, [novelId, noticeId]);

  const loadNotice = async () => {
    try {
      const res = await fetch(`/api/novel/${novelId}/notice/${noticeId}`);
      if (!res.ok) throw new Error("공지사항을 찾을 수 없습니다.");
      const data = await res.json();
      setNotice(data.notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">에러 발생</h2>
        <p className="text-muted mb-6">{error}</p>
        <Link href={`/novel/${novelId}`} className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl text-sm">
          작품으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/novel/${novelId}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-2xl font-extrabold text-foreground flex-1">작가 공지사항</h1>
        {currentUserId && notice.novel?.authorId === currentUserId && (
          <Link
            href={`/novel/${novelId}/notice/${noticeId}/edit`}
            className="px-4 py-2 text-sm font-bold bg-gray-100 hover:bg-gray-200 text-foreground/80 rounded-lg transition-colors"
          >
            수정
          </Link>
        )}
      </div>

      <article className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
        <header className="p-8 border-b border-gray-50 bg-canvas/30">
          <h2 className="text-2xl font-bold text-foreground mb-4">{notice.title}</h2>
          <div className="flex items-center gap-4 text-xs text-muted font-bold">
            <span className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(notice.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><Eye size={14}/> {notice.views.toLocaleString()}</span>
          </div>
        </header>
        {/* 첨부 이미지 */}
        {notice.image && (
          <div className="border-b border-gray-50 bg-canvas/20 flex justify-center p-4">
            <img
              src={notice.image}
              alt="공지 첨부 이미지"
              className="max-w-full max-h-[480px] object-contain rounded-xl"
            />
          </div>
        )}
        <div 
          className="p-8 text-foreground/90 leading-relaxed text-[15px] prose prose-purple max-w-none tiptap"
          dangerouslySetInnerHTML={{ __html: notice.content }}
        />
      </article>

      <div className="mt-8 flex justify-center">
        <Link 
          href={`/novel/${novelId}`}
          className="px-8 py-3 border border-border rounded-xl text-sm font-bold text-muted hover:bg-canvas transition-colors"
        >
          목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
