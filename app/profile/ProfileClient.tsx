"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, BookOpen, Edit2, Check, X } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";

type Novel = {
  id: number;
  title: string;
  views: number;
  rating: number;
};

type UserData = {
  id: string;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  novels: Novel[];
};

export default function ProfileClient({ user }: { user: UserData }) {
  const [activeTab, setActiveTab] = useState<"profile" | "novels" | "taste">("novels");
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(user.bio || "안녕하세요");
  const [savingBio, setSavingBio] = useState(false);

  const handleSaveBio = async () => {
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <AvatarUpload user={{ id: user.id, avatar: user.avatar, name: user.nickname }} />
            <button className="absolute bottom-0 right-0 p-1.5 bg-surface border border-border rounded-full shadow-sm hover:bg-canvas transition-colors">
              <Settings size={16} className="text-muted" />
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span>{user.nickname}</span>
              <span className="text-lg font-normal text-muted">님의 회원카드</span>
            </h1>
            
            <div className="mt-2 flex items-center gap-2">
              {isEditingBio ? (
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
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingBio(true)}>
                  <p className="text-muted">{bio}</p>
                  <button className="p-1 rounded-full text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface">
                    <Edit2 size={14} />
                  </button>
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
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col items-center justify-center h-[300px] text-muted">
              프로필 정보가 여기에 표시됩니다.
            </div>
          </div>
        )}

        {activeTab === "novels" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col h-[300px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-foreground">연재중인 소설</h2>
                <Link href="/novel/create" className="text-xs font-medium px-3 py-1.5 bg-canvas border border-border rounded-full hover:bg-surface transition-colors">
                  새 소설 쓰기
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
        )}

        {activeTab === "taste" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border flex flex-col items-center justify-center h-[300px] text-muted">
              취향 분석 결과가 여기에 표시됩니다.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
