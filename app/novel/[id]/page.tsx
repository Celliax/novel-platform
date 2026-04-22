import { notFound, redirect } from "next/navigation";
import { getNovelWithEpisodes, isUserFavorited, listNovelsForHome, getUserById } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import NovelDetailClient from "@/components/NovelDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NovelDetailPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  if (isNaN(id)) notFound();

  // 1. Fetch novel data
  const novel = await getNovelWithEpisodes(id);
  if (!novel) notFound();

  // 2. Fetch user session and related data
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAuthor = false;
  let isFavorited = false;

  if (user) {
    isAuthor = user.id === novel.authorId;
    isFavorited = await isUserFavorited(id, user.id);

    // 3. Age certification check
    if (novel.ageRating === "19세 이용가") {
      const dbUser = await getUserById(user.id);
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

  // 4. Recommended novels
  const allNovels = await listNovelsForHome();
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
