"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ProfileSetupPage() {
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
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
      setInitializing(false);
    }
    loadUser();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Supabase auth metadata 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      data: { 
        nickname: nickname.trim(),
        gender: gender 
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
      body: JSON.stringify({ nickname: nickname.trim(), gender })
    });

    if (!res.ok) {
      setError("프로필 저장에 실패했습니다.");
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
          환영합니다! 플랫폼에서 사용할 닉네임과 성별을 입력해주세요.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
              <option value="" disabled>선택해주세요</option>
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
              <option value="OTHER">선택 안 함 / 기타</option>
            </select>
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