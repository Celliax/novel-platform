import Link from "next/link";
import NovelCard from "@/components/NovelCard";
import { listNovelsForHome, getSystemNotices } from "@/lib/novel-service";
import { NovelWithAuthor } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ID } from "@/lib/constants";
import { Megaphone, PlusCircle, ChevronRight, Trophy, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function Home() {
  let novels: NovelWithAuthor[] = [];
  let systemNotices: any[] = [];
  let dbError = false;

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.id === ADMIN_ID;

  try {
    const [fetchedNovels, fetchedNotices] = await Promise.all([
      listNovelsForHome(),
      getSystemNotices()
    ]);
    novels = fetchedNovels;
    systemNotices = fetchedNotices;
  } catch (error) {
    console.error("Home page data fetch error:", error);
    dbError = true;
  }

  // 일반 소설 / 이벤트 참여작 분리
  const regularNovels = novels.filter(n => !n.isEvent);
  const eventNovels   = novels.filter(n => n.isEvent);

  return (
    <div className="bg-white min-h-screen">
      {/* ─── System Notice Bar ─── */}
      {systemNotices.length > 0 && (
        <div className="bg-purple-50 border-b border-purple-100">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-extrabold rounded-full shrink-0">
              <Megaphone size={12} /> NOTICE
            </span>
            <div className="flex-1 text-xs sm:text-sm text-purple-900 font-bold truncate">
              <Link href={`/notice/${systemNotices[0].id}`} className="hover:underline">
                {systemNotices[0].title}
              </Link>
            </div>
            {isAdmin && (
              <Link href="/admin/notice" className="text-[11px] font-extrabold text-purple-600 hover:underline flex items-center">
                공지 관리 <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        {dbError && (
          <div className="mb-10 rounded-2xl bg-red-50 text-red-900 p-6 border border-red-100 shadow-sm">
            <h3 className="font-extrabold text-lg mb-1">시스템 연결 확인 중</h3>
            <p className="text-sm opacity-80">데이터베이스를 불러오는 중 오류가 발생했습니다.</p>
          </div>
        )}

        {/* ─── Hero Section ─── */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[11px] font-extrabold rounded-full">FRESH STORIES</span>
            {isAdmin && (
              <Link href="/admin/notice" className="flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white text-[11px] font-extrabold rounded-full hover:bg-black transition-colors">
                <PlusCircle size={12} /> 전체 공지 작성
              </Link>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
            당신의 이야기가<br/>시작되는 곳, <span className="text-purple-600">Novel Platform</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 font-medium leading-relaxed">
            누구나 자유롭게 상상의 나래를 펼치고,<br className="hidden sm:block"/>
            소중한 작품을 세상에 선보일 수 있습니다.
          </p>
        </div>

        {/* ─── 일반 소설 Grid ─── */}
        <div className="flex items-center justify-between mb-8 border-b-2 border-gray-900 pb-4">
          <h2 className="text-2xl font-black text-gray-900">오늘의 추천 소설</h2>
          <Link href="/novel/create" className="text-sm font-extrabold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1">
            소설 쓰기 <PlusCircle size={16} />
          </Link>
        </div>

        {regularNovels.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold text-lg mb-6">아직 등록된 작품이 없습니다.</p>
            <Link href="/novel/create" className="px-8 py-4 bg-purple-600 text-white font-black rounded-2xl shadow-lg hover:bg-purple-700 transition-all active:scale-95">
              첫 번째 작가 되어보기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {regularNovels.map((novel) => (
              <NovelCard
                key={novel.id}
                id={novel.id}
                title={novel.title}
                author={novel.author?.nickname || novel.author?.name || "작자미상"}
                genre={novel.genre}
                ageRating={novel.ageRating}
                coverImage={novel.coverImage}
                views={novel.views}
                rating={novel.rating}
                recommendCount={novel.recommendCount}
              />
            ))}
          </div>
        )}

        {/* ─── 5월 이벤트 참여작 섹션 ─── */}
        <section className="mt-20 sm:mt-28" aria-labelledby="event-section-title">
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between border-b-2 border-amber-400 pb-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] font-extrabold rounded-full shadow-sm">
                <Trophy size={11} /> EVENT
              </span>
              <div>
                <h2
                  id="event-section-title"
                  className="text-2xl font-black text-gray-900 flex items-center gap-2"
                >
                  5월 특별 이벤트 참여작
                  <Sparkles size={20} className="text-amber-400" />
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">이벤트 기간: ~2025년 5월 23일(금)</p>
              </div>
            </div>
            <Link
              href="/novel/create"
              className="text-sm font-extrabold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
            >
              참여하기 <PlusCircle size={16} />
            </Link>
          </div>

          {/* 이벤트 소설 목록 */}
          {eventNovels.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border-2 border-dashed border-amber-100 bg-gradient-to-b from-amber-50/50 to-orange-50/30">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-gray-600 font-bold text-base mb-1">아직 이벤트에 참여한 작품이 없습니다.</p>
              <p className="text-gray-400 text-sm mb-7">소설 등록 시 &apos;이벤트 등록&apos;을 선택하면 여기에 표시됩니다!</p>
              <Link
                href="/novel/create"
                className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-extrabold rounded-2xl shadow-md hover:opacity-90 transition-all active:scale-95 text-sm"
              >
                <Trophy size={14} /> 이벤트 참여하기
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {eventNovels.map((novel) => (
                <div key={novel.id} className="relative">
                  <div className="absolute -top-2 -right-2 z-10 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black rounded-full shadow-md leading-tight">
                    🏆 EVENT
                  </div>
                  <NovelCard
                    id={novel.id}
                    title={novel.title}
                    author={novel.author?.nickname || novel.author?.name || "작자미상"}
                    genre={novel.genre}
                    ageRating={novel.ageRating}
                    coverImage={novel.coverImage}
                    views={novel.views}
                    rating={novel.rating}
                    recommendCount={novel.recommendCount}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
