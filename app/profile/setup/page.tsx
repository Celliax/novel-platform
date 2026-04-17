"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Camera, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ProfileSetupPage() {
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      
      // 구글 등 소셜에서 받아온 기본 이름 설정
      const meta = session.user.user_metadata;
      setNickname(meta?.nickname || meta?.full_name || "");
      setGender(meta?.gender || "");
      setAvatar(meta?.avatar_url || null);
      setInitializing(false);
    }
    loadUser();
  }, [router, supabase]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setAvatar(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!age || Number(age) < 1) {
      setError("올바른 나이를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    const trimNickname = nickname.trim();

    // Supabase auth metadata 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      data: { 
        nickname: trimNickname,
        gender: gender,
        avatar_url: avatar,
        age: Number(age)
      }
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // 서버 액션을 통해 Prisma User DB 업데이트 (여기선 편의상 API 호출)
    const res = await fetch("/api/user/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: trimNickname, gender, age: Number(age), avatar })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "프로필 저장에 실패했습니다. 입력값을 확인해주세요.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (initializing) {
    return <div className="flex-1 flex justify-center items-center">로딩 중...</div>;
  }

  return (
    <div className="hero-gradient flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-card-hover ring-1 ring-border/60">
        <h1 className="text-2xl font-bold text-foreground text-center">프로필 설정</h1>
        <p className="mt-2 text-sm text-muted text-center">
          환영합니다! 원활한 서비스 이용을 위해 추가 정보를 입력해주세요.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-6">
            <div 
              className="relative group cursor-pointer w-24 h-24 mb-2"
              onClick={() => document.getElementById("avatar-input")?.click()}
            >
              {avatar ? (
                <img src={avatar} alt="미리보기" className="w-24 h-24 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-canvas border border-border flex items-center justify-center">
                  <UserIcon size={40} className="text-muted" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/30">
                <Camera className="text-white" size={24} />
              </div>
              <input 
                id="avatar-input"
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
              />
            </div>
            <span className="text-xs text-muted">프로필 사진 등록 (선택)</span>
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-foreground mb-2">
              표시 닉네임
            </label>
            <input
              id="nickname"
              type="text"
              required
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              placeholder="예: 홍길동"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-foreground mb-2">
                성별
              </label>
              <select
                id="gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 appearance-none"
              >
                <option value="" disabled>선택</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-foreground mb-2">
                나이
              </label>
              <input
                id="age"
                type="number"
                required
                min="1"
                value={age}
                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full rounded-xl border border-border bg-canvas px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                placeholder="세"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 text-red-700 px-3 py-2 text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 text-white font-medium py-3 hover:bg-brand-700 transition-colors shadow-card"
          >
            {loading ? "저장 중..." : "설정 완료하고 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}