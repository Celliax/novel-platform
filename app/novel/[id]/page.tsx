import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronRight, Eye, Star } from "lucide-react";
import { getNovelWithEpisodes } from "@/lib/novel-service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function NovelDetailPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const novel = await getNovelWithEpisodes(id);
  if (!novel) notFound();

  const firstEpisode = novel.episodes[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      <div className="grid md:grid-cols-[220px_1fr] gap-8 lg:gap-12 items-start">
        <div className="mx-auto w-full max-w-[220px]">
          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-card ring-1 ring-border/60">
            <Image
              src={novel.coverImage}
              alt={novel.title}
              fill
              className="object-cover"
              sizes="220px"
              priority
            />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-medium bg-brand-50 text-brand-700 px-2.5 py-1 rounded-md">
              {novel.genre}
            </span>
            <span className="text-sm text-muted">{novel.author}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {novel.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Eye size={16} aria-hidden /> {novel.views.toLocaleString()} 조회
            </span>
            <span className="flex items-center gap-1.5">
              <Star size={16} className="text-amber-400 fill-amber-400" aria-hidden />
              {novel.rating.toFixed(1)}
            </span>
          </div>
          <div
            className="mt-6 reader-content text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: novel.synopsis }}
          />
          {firstEpisode && (
            <Link
              href={`/novel/${novel.id}/episode/${firstEpisode.id}`}
              className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors shadow-card"
            >
              <BookOpen size={18} aria-hidden />
              첫 화부터 읽기
            </Link>
          )}
        </div>
      </div>

      <section className="mt-14">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          목차
          <span className="text-sm font-normal text-muted">({novel.episodes.length}화)</span>
        </h2>
        <ul className="rounded-2xl bg-surface ring-1 ring-border/60 shadow-card divide-y divide-border/80 overflow-hidden">
          {novel.episodes.map((ep) => (
            <li key={ep.id}>
              <Link
                href={`/novel/${novel.id}/episode/${ep.id}`}
                className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-brand-50/50 transition-colors group"
              >
                <span className="font-medium text-foreground group-hover:text-brand-700">
                  {ep.chapterNo}화. {ep.title}
                </span>
                <ChevronRight
                  size={18}
                  className="text-muted shrink-0 group-hover:text-brand-600"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
