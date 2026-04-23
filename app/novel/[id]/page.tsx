import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getNovelWithEpisodes, isUserFavorited, listNovelsForHome, getUserById } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import NovelDetailClient from "@/components/NovelDetailClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fptnovel.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  if (isNaN(id)) return {};

  const novel = await getNovelWithEpisodes(id);
  if (!novel) return {};

  const title = `${novel.title} | FPT 소설 플랫폼`;
  const description = novel.synopsis
    ? novel.synopsis.slice(0, 150)
    : `${novel.title} - FPT 소설 플랫폼에서 읽어보세요.`;
  const coverImage = novel.coverImage && !novel.coverImage.startsWith('/placeholder')
    ? novel.coverImage
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/novel/${id}`,
      siteName: "FPT 소설 플랫폼",
      type: "website",
      ...(coverImage ? { images: [{ url: coverImage, width: 400, alt: novel.title }] } : {}),
    },
    twitter: {
      card: coverImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(coverImage ? { images: [coverImage] } : {}),
    },
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NovelDetailPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  if (isNaN(id)) notFound();

  // 1. Fetch novel and user session in parallel
  const supabase = await getSupabaseServerClient();
  const [novel, { data: { user } }, allNovels] = await Promise.all([
    getNovelWithEpisodes(id),
    supabase.auth.getUser(),
    listNovelsForHome()
  ]);

  if (!novel) notFound();

  let isAuthor = false;
  let isFavorited = false;

  if (user) {
    isAuthor = user.id === novel.authorId;
    const [favorited, dbUser] = await Promise.all([
      isUserFavorited(id, user.id),
      getUserById(user.id)
    ]);
    
    isFavorited = favorited;

    // 2. Age certification check
    if (novel.ageRating === "19세 이용가") {
      if (!dbUser || !dbUser.age) {
        // 인증 안된 경우 프로필 설정 유도
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm text-center">
              <h2 className="text-xl font-bold mb-4 text-gray-900">성인 인증이 필요합니다</h2>
              <p className="text-gray-500 text-sm mb-6">이 작품은 성인 전용 콘텐츠입니다. 성인 인증을 위해 프로필을 설정해주세요.</p>
              <div className="flex gap-3">
                <a href="/" className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm">홈으로</a>
                <a href="/profile/setup" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm">인증하러 가기</a>
              </div>
            </div>
          </div>
        );
      }
      if (dbUser.age < 19) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm text-center">
              <h2 className="text-xl font-bold mb-4 text-red-600">접근 제한</h2>
              <p className="text-gray-500 text-sm mb-6">만 19세 미만은 이용할 수 없는 작품입니다.</p>
              <a href="/" className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm">홈으로 돌아가기</a>
            </div>
          </div>
        );
      }
    }
  } else if (novel.ageRating === "19세 이용가") {
    redirect("/login");
  }

  // 3. Recommended novels (already fetched in parallel above)
  const recommendedNovels = allNovels.filter(n => n.id !== id).slice(0, 3);

  // Note: Comments are handled by CommentSection which is a client component inside NovelDetailClient

  return (
    <NovelDetailClient 
      novel={novel as any} 
      isAuthor={isAuthor} 
      initialIsFavorited={isFavorited}
      recommendedNovels={recommendedNovels as any}
    />
  );
}
