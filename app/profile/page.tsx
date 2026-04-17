import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/prisma";
import Link from "next/link";
import { Settings, BookOpen } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { 
      novels: {
        orderBy: { updatedAt: 'desc' }
      } 
    },
  });

  if (!user || !user.isProfileComplete) {
    redirect("/profile/setup");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <AvatarUpload user={{ id: user.id, avatar: user.avatar, name: user.name }} />
            <button className="absolute bottom-0 right-0 p-1.5 bg-surface border border-border rounded-full shadow-sm hover:bg-canvas transition-colors">
              <Settings size={16} className="text-muted" />
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span>{user.name}</span>
              <span className="text-lg font-normal text-muted">님의 회원카드</span>
            </h1>
            <p className="text-muted mt-1">안녕하세요</p>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6 md:mt-0">
          <button className="px-5 py-2 rounded-full bg-ink text-canvas font-medium text-sm">프로필</button>
          <button className="px-5 py-2 rounded-full text-muted hover:bg-surface font-medium text-sm transition-colors">연재소설</button>
          <button className="px-5 py-2 rounded-full text-muted hover:bg-surface font-medium text-sm transition-colors">취향</button>
          <button className="px-5 py-2 rounded-full text-muted hover:bg-surface font-medium text-sm transition-colors">댓글</button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        
        {/* 연재중인 소설 */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg text-foreground">연재중인 소설</h2>
            <Link href="/novel/create" className="text-xs font-medium px-3 py-1.5 bg-canvas border border-border rounded-full hover:bg-surface transition-colors">
              연재소설
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center overflow-hidden">
            {user.novels.length > 0 ? (
              <div className="w-full space-y-3 overflow-y-auto max-h-[200px] pr-2">
                {user.novels.map(novel => (
                  <Link key={novel.id} href={`/novel/${novel.id}`} className="block p-3 rounded-xl border border-border hover:bg-canvas transition-colors text-left group">
                    <div className="font-medium text-foreground truncate group-hover:text-brand-600 transition-colors">{novel.title}</div>
                    <div className="text-xs text-muted mt-1">조회수 {novel.views} · 별점 {novel.rating}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-canvas rounded-full flex items-center justify-center mb-3 text-muted/50">
                  <BookOpen size={32} />
                </div>
                <p className="text-sm text-muted font-medium">연재중인 소설이 없습니다.</p>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
