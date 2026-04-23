import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, User as UserIcon, Book, Calendar, ChevronRight } from "lucide-react";
import { getUserWithNovels } from "@/lib/novel-service";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = await getUserWithNovels(id);

  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Profile Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center">
          <div className="relative w-32 h-32 mb-6 group">
            <div className="absolute inset-0 bg-purple-100 rounded-[2.5rem] rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
            <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-white border-4 border-white shadow-xl">
              {profile.avatar ? (
                <Image src={profile.avatar} alt={profile.nickname} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                  <UserIcon size={48} />
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">{profile.nickname}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400 font-bold mb-6">
            <span className="flex items-center gap-1.5"><Book size={14} /> 작품 {profile.novels.length}</span>
            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> 가입 {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>

          {!profile.isPrivate && profile.bio && (
            <p className="max-w-md text-center text-gray-500 leading-relaxed font-medium">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {profile.isPrivate ? (
          /* Private Profile State */
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
              <Lock size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">비공개 프로필입니다</h2>
            <p className="text-sm text-gray-400 font-medium">사용자의 요청에 의해 프로필이 비공개로 설정되었습니다.</p>
          </div>
        ) : (
          /* Public Profile Works */
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">연재 중인 작품</h2>
              <span className="text-xs font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider">Works</span>
            </div>

            {profile.novels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.novels.map((novel) => (
                  <Link 
                    key={novel.id} 
                    href={`/novel/${novel.id}`}
                    className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all p-5 flex gap-5"
                  >
                    <div className="relative w-24 aspect-[3/4] rounded-xl overflow-hidden shadow-md shrink-0">
                      <Image src={novel.coverImage} alt={novel.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1">{novel.genre}</span>
                      <h3 className="text-lg font-black text-gray-900 truncate mb-1 group-hover:text-purple-600 transition-colors">{novel.title}</h3>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold">
                        <span>조회 {novel.views.toLocaleString()}</span>
                        <span>추천 {novel.rating.toLocaleString()}</span>
                      </div>
                      <div className="mt-auto flex justify-end">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-[2rem] border border-gray-100/50">
                <p className="text-sm text-gray-400 font-bold">아직 연재 중인 작품이 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
