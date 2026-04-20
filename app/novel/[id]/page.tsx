"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronRight, Eye, Star, Plus, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Novel = {
  id: number;
  title: string;
  authorId: string;
  author: string;
  genre: string;
  coverImage: string;
  views: number;
  rating: number;
  synopsis: string;
  episodes: {
    id: number;
    chapterNo: number;
    title: string;
  }[];
};

export default function NovelDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    loadNovel();
  }, [id]);

  const loadNovel = async () => {
    try {
      const response = await fetch(`/api/novel/${id}`);
      if (response.ok) {
        const novelData = await response.json();
        setNovel(novelData);

        // 현재 사용자와 작가 비교
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthor(user?.id === novelData.authorId);

        if (user) {
          const favRes = await fetch(`/api/novel/${id}/favorite`);
          if (favRes.ok) {
            const favData = await favRes.json();
            setIsFavorited(favData.isFavorited);
          }
        }
      } else {
        notFound();
      }
    } catch (error) {
      console.error("작품 로드 실패:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      const res = await fetch(`/api/novel/${id}/favorite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.isFavorited);
      } else if (res.status === 401) {
        alert("로그인이 필요합니다.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="hero-gradient flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!novel) {
    notFound();
  }

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
            <button 
              onClick={toggleFavorite} 
              disabled={favoriteLoading}
              className={`flex items-center gap-1.5 transition-colors ${isFavorited ? "text-red-500" : "text-muted hover:text-red-400"}`}
            >
              <Heart size={16} className={isFavorited ? "fill-red-500" : ""} aria-hidden />
              선호작
            </button>
          </div>
          <div
            className="mt-6 reader-content text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: novel.synopsis }}
          />
          <div className="flex gap-3 mt-8">
            {firstEpisode && (
              <Link
                href={`/novel/${novel.id}/episode/${firstEpisode.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors shadow-card"
              >
                <BookOpen size={18} aria-hidden />
                첫 화부터 읽기
              </Link>
            )}
            {isAuthor && (
              <Link
                href={`/novel/${novel.id}/episode/create`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-card"
              >
                <Plus size={18} aria-hidden />
                연재하기
              </Link>
            )}
          </div>
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
