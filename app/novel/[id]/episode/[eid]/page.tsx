import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, List, AlertCircle } from "lucide-react";
import EpisodeReader from "@/components/EpisodeReader";
import CommentSection from "@/components/CommentSection";
import { getEpisodeNavigation } from "@/lib/novel-service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string; eid: string }> };

export default async function EpisodePage({ params }: Props) {
  const { id: novelIdStr, eid: episodeIdStr } = await params;
  const novelId = Number(novelIdStr);
  const episodeId = Number(episodeIdStr);
  if (!Number.isFinite(novelId) || !Number.isFinite(episodeId)) notFound();

  let data = null;
  try {
    data = await getEpisodeNavigation(novelId, episodeId);
  } catch (error) {
    console.error("Episode page fetch error:", error);
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 text-red-900 p-6 rounded-2xl ring-1 ring-red-200 inline-block text-left max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-red-600" />
            <h3 className="font-bold text-lg">데이터베이스 연결 실패</h3>
          </div>
          <p className="text-sm opacity-90 leading-relaxed">
            회차 정보를 가져오는 도중 에러가 발생했습니다. Render 대시보드에서 DATABASE_URL 설정을 확인해 주세요.
          </p>
        </div>
      </div>
    );
  }

  if (!data) notFound();

  const { novel, episode, prev, next } = data;

  // 조회수 증가
  const { incrementEpisodeViews } = await import("@/lib/novel-service");
  await incrementEpisodeViews(novelId, episodeId);

  return (
    <div className="bg-surface min-h-full">
      <div className="border-b border-border bg-canvas/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            href={`/novel/${novel.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <List size={18} aria-hidden />
            {novel.title} — 목차
          </Link>
          <p className="text-sm text-muted">
            {episode.chapterNo}화 · {episode.title}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <EpisodeReader 
          title={episode.title} 
          contentHtml={episode.content} 
          image={episode.image || undefined}
          authorNote={episode.authorNote || undefined}
          novelId={novel.id}
          episodeId={episode.id}
        />

        <nav
          className="mt-14 flex flex-col sm:flex-row gap-3 sm:justify-between"
          aria-label="에피소드 이동"
        >
          {prev ? (
            <Link
              href={`/novel/${novel.id}/episode/${prev.id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl ring-1 ring-border bg-surface hover:bg-brand-50/60 hover:ring-brand-200 transition-colors text-sm font-medium"
            >
              <ChevronLeft size={18} aria-hidden />
              이전 화
            </Link>
          ) : (
            <span className="hidden sm:block sm:w-[140px]" />
          )}
          {next ? (
            <Link
              href={`/novel/${novel.id}/episode/${next.id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-colors text-sm font-medium sm:order-none order-first"
            >
              다음 화
              <ChevronRight size={18} aria-hidden />
            </Link>
          ) : (
            <Link
              href={`/novel/${novel.id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl ring-1 ring-border bg-surface hover:bg-brand-50/60 text-sm font-medium"
            >
              목차로 돌아가기
            </Link>
          )}
        </nav>

        <CommentSection 
          novelId={novel.id} 
          episodeId={episode.id} 
          authorId={novel.authorId}
          title="회차 댓글"
        />
      </div>
    </div>
  );
}
