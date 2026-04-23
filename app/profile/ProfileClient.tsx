"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, BookOpen, Edit2, Check, X, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type Novel = {
  id: number;
  title: string;
  views: number;
  rating: number;
};

type FavoriteNovel = {
  novelId: number;
  createdAt: Date;
  novel: {
    id: number;
    title: string;
    views: number;
    rating: number;
    tags: { tag: { name: string } }[];
  }
};

type UserData = {
  id: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  isPrivate: boolean;
  novels: Novel[];
  favorites: FavoriteNovel[];
};

export default function ProfileClient({ user, isOwnProfile = false }: { user: UserData, isOwnProfile?: boolean }) {
  const [activeTab, setActiveTab] = useState<"profile" | "novels" | "taste">("profile");
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(user.bio || "안녕하세요");
  const [savingBio, setSavingBio] = useState(false);

  const [isPrivate, setIsPrivate] = useState(user.isPrivate);
  const [savingPrivate, setSavingPrivate] = useState(false);

  // Pagination for favorites
  const [favPage, setFavPage] = useState(1);
  const itemsPerPage = 5;
  const totalFavPages = Math.max(1, Math.ceil(user.favorites.length / itemsPerPage));

  const handleSaveBio = async () => {
    if (!isOwnProfile) return;
    setSavingBio(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio })
      });
      if (res.ok) {
        setIsEditingBio(false);
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (e) {
      alert("오류가 발생했습니다.");
    } finally {
      setSavingBio(false);
    }
  };

  const togglePrivate = async () => {
    if (!isOwnProfile) return;
    setSavingPrivate(true);
    const newValue = !isPrivate;
    try {
      const res = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: newValue })
      });
      if (res.ok) {
        setIsPrivate(newValue);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPrivate(false);
    }
  };

  // Radar Chart Data
  const tagCounts: Record<string, number> = {};
  user.favorites.forEach((fav) => {
    fav.novel.tags.forEach((t) => {
      const name = t.tag.name;
      tagCounts[name] = (tagCounts[name] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8); // Top 8 tags

  const chartData = {
    labels: sortedTags.length > 0 ? sortedTags.map(t => t[0]) : ["판타지", "로맨스", "무협", "현판"],
    datasets: [
      {
        label: '선호도',
        data: sortedTags.length > 0 ? sortedTags.map(t => t[1]) : [0, 0, 0, 0],
        backgroundColor: 'rgba(251, 113, 133, 0.2)', // rose-400
        borderColor: 'rgba(244, 63, 94, 1)', // rose-500
        borderWidth: 2,
        pointBackgroundColor: 'rgba(244, 63, 94, 1)',
      },
    ],
  };

  const chartOptions = {
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: Math.max(...(sortedTags.length > 0 ? sortedTags.map(t => t[1]) : [5])) + 1,
        ticks: { stepSize: 1, display: false },
      },
    },
    plugins: {
      legend: { position: 'top' as const }
    },
    maintainAspectRatio: false,
  };

  // Pagination bounds
  const currentFavorites = user.favorites.slice((favPage - 1) * itemsPerPage, favPage * itemsPerPage);

  const renderNovels = (novels: Novel[], title: string) => (
    <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-lg text-foreground">{title}</h2>
        {isOwnProfile && (
          <Link href="/novel/create" className="text-xs font-medium px-3 py-1.5 bg-canvas border border-border rounded-full hover:bg-surface transition-colors">
            새 소설 쓰기
          </Link>
        )}
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center overflow-hidden">
        {novels.length > 0 ? (
          <div className="w-full space-y-3 overflow-y-auto max-h-[200px] pr-2">
            {novels.map(novel => (
              <Link key={novel.id} href={`/novel/${novel.id}`} className="block p-3 rounded-xl border border-border hover:bg-canvas transition-colors text-left group">
                <div className="font-medium text-foreground truncate group-hover:text-brand-600 transition-colors">{novel.title}</div>
                <div className="text-xs text-muted mt-1">조회수 {novel.views.toLocaleString()} · 추천 {novel.rating.toLocaleString()}</div>
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
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {isOwnProfile ? (
              <AvatarUpload user={{ id: user.id, avatar: user.avatar, name: user.nickname }} />
            ) : (
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-gray-50 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt={user.nickname || ""} />
                ) : (
                  <Settings size={32} className="text-gray-300" />
                )}
              </div>
            )}
            {isOwnProfile && (
              <button className="absolute bottom-0 right-0 p-1.5 bg-surface border border-border rounded-full shadow-sm hover:bg-canvas transition-colors">
                <Settings size={16} className="text-muted" />
              </button>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span>{user.nickname}</span>
              <span className="text-lg font-normal text-muted">님의 회원카드</span>
              {isPrivate && <Lock size={16} className="text-muted ml-1" />}
            </h1>
            
            <div className="mt-2 flex items-center gap-2">
              {isEditingBio && isOwnProfile ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="rounded-lg border border-border bg-canvas px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 w-64"
                    autoFocus
                  />
                  <button onClick={handleSaveBio} disabled={savingBio} className="p-1.5 rounded-full text-brand-600 hover:bg-brand-50 transition-colors">
                    <Check size={16} />
                  </button>
                  <button onClick={() => { setIsEditingBio(false); setBio(user.bio || "안녕하세요"); }} className="p-1.5 rounded-full text-muted hover:bg-surface transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className={`flex items-center gap-2 group ${isOwnProfile ? 'cursor-pointer' : ''}`} onClick={() => isOwnProfile && setIsEditingBio(true)}>
                  <p className="text-muted">{bio}</p>
                  {isOwnProfile && (
                    <button className="p-1 rounded-full text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6 md:mt-0">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${activeTab === "profile" ? "bg-ink text-canvas" : "text-muted hover:bg-surface"}`}
          >
            프로필
          </button>
          <button 
            onClick={() => setActiveTab("novels")}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${activeTab === "novels" ? "bg-ink text-canvas" : "text-muted hover:bg-surface"}`}
          >
            연재소설
          </button>
          <button 
            onClick={() => setActiveTab("taste")}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-colors ${activeTab === "taste" ? "bg-ink text-canvas" : "text-muted hover:bg-surface"}`}
          >
            취향
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="mt-8">
        {/* Privacy Check */}
        {!isOwnProfile && isPrivate ? (
          <div className="bg-surface rounded-3xl border border-border shadow-sm p-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-canvas rounded-3xl flex items-center justify-center text-muted/30 mb-6 border border-border">
              <Lock size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">비공개 프로필입니다</h2>
            <p className="text-sm text-muted font-medium">사용자의 요청에 의해 프로필이 비공개로 설정되었습니다.</p>
          </div>
        ) : (
          <>
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isOwnProfile && (
                  <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col h-[300px]">
                    <h2 className="font-bold text-lg text-foreground mb-6">프로필 설정</h2>
                    <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div>
                        <div className="font-medium text-foreground">프로필 비공개</div>
                        <div className="text-xs text-muted mt-1">다른 사용자에게 내 프로필을 숨깁니다.</div>
                      </div>
                      <button 
                        onClick={togglePrivate}
                        disabled={savingPrivate}
                        className={`w-11 h-6 rounded-full transition-colors relative ${isPrivate ? "bg-brand-600" : "bg-border"}`}
                      >
                        <span className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${isPrivate ? "left-6" : "left-1"}`} />
                      </button>
                    </div>
                  </div>
                )}
                
                {renderNovels(user.novels, "연재중인 소설")}
              </div>
            )}

            {activeTab === "novels" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderNovels(user.novels, "연재중인 소설")}
              </div>
            )}

            {activeTab === "taste" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Radar Chart */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col items-center">
                  <h2 className="w-full font-bold text-lg text-foreground flex items-center gap-2 mb-6">
                    <BookOpen size={18} className="text-muted" /> 취향 <span className="text-sm font-normal text-muted">({isOwnProfile ? '나의 분석' : '사용자 분석'})</span>
                  </h2>
                  <div className="w-full max-w-[300px] aspect-square relative">
                    <Radar data={chartData} options={chartOptions} />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {sortedTags.length > 0 ? (
                      sortedTags.map(t => (
                        <span key={t[0]} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-md text-sm font-medium">
                          #{t[0]}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted text-sm">선호작을 추가하면 취향이 분석됩니다.</span>
                    )}
                  </div>
                </div>

                {/* Right: Favorited Novels List */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col h-full min-h-[400px]">
                  <h2 className="w-full font-bold text-lg text-foreground flex items-center gap-2 mb-6">
                    <BookOpen size={18} className="text-muted" /> 선호하는 소설
                  </h2>
                  
                  <div className="flex-1 flex flex-col">
                    {user.favorites.length > 0 ? (
                      <ul className="divide-y divide-border/80">
                        {currentFavorites.map((fav, index) => {
                          const rank = (favPage - 1) * itemsPerPage + index + 1;
                          return (
                            <li key={fav.novelId} className="py-3">
                              <Link href={`/novel/${fav.novelId}`} className="flex items-center gap-3 group">
                                <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                  {rank}
                                </span>
                                <span className="font-medium text-foreground group-hover:text-brand-600 transition-colors truncate">
                                  {fav.novel.title}
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted text-sm">
                        선호작이 없습니다.
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {user.favorites.length > 0 && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                      <button 
                        onClick={() => setFavPage(p => Math.max(1, p - 1))}
                        disabled={favPage === 1}
                        className="p-1.5 border border-border rounded text-muted hover:bg-canvas disabled:opacity-50"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalFavPages }).map((_, i) => {
                        const p = i + 1;
                        return (
                          <button
                            key={p}
                            onClick={() => setFavPage(p)}
                            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${favPage === p ? "bg-black text-white" : "text-muted hover:bg-canvas"}`}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button 
                        onClick={() => setFavPage(p => Math.min(totalFavPages, p + 1))}
                        disabled={favPage === totalFavPages}
                        className="p-1.5 border border-border rounded text-muted hover:bg-canvas disabled:opacity-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
