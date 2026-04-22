import { getSystemNotice } from "@/lib/novel-service";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noticeId = parseInt(id);
  const notice = await getSystemNotice(noticeId);

  if (!notice) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* ─── Breadcrumb / Header ─── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 font-bold transition-colors">
            <ChevronLeft size={18} /> 홈으로
          </Link>
          <span className="text-xs font-black text-gray-400">SYSTEM NOTICE</span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        <article className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-purple-500/5 overflow-hidden">
          {/* ─── Notice Header ─── */}
          <div className="p-8 sm:p-12 border-b border-gray-50 bg-gradient-to-br from-white to-purple-50/30">
            <div className="flex items-center gap-2 mb-6">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${notice.isImportant ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                {notice.isImportant ? 'IMPORTANT' : 'NOTICE'}
              </span>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
                <Calendar size={14} />
                {new Date(notice.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
              {notice.title}
            </h1>
          </div>

          {/* ─── Notice Content ─── */}
          <div className="p-8 sm:p-12">
            <div className="prose prose-purple max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium text-base sm:text-lg">
                {notice.content}
              </div>
            </div>
          </div>

          {/* ─── Footer Info ─── */}
          <div className="px-8 py-6 bg-gray-50 flex items-center justify-between border-t border-gray-100">
            <div className="flex items-center gap-2 text-gray-400">
              <Megaphone size={16} />
              <span className="text-xs font-bold uppercase">Novel Platform Team</span>
            </div>
            <Link href="/" className="text-xs font-black text-purple-600 hover:underline">
              목록으로 돌아가기
            </Link>
          </div>
        </article>

        {/* ─── Bottom Decoration ─── */}
        <p className="text-center mt-12 text-gray-400 text-xs font-medium">
          &copy; 2026 Novel Platform. 모든 공지사항은 운영 방침에 따라 업데이트됩니다.
        </p>
      </main>
    </div>
  );
}
