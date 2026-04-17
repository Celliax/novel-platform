"use client";

import Link from "next/link";
import { BookOpen, PenTool, User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseClient();
    
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 로그인 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-surface/90 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <BookOpen size={28} aria-hidden />
          <span>NovelPlatform</span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base text-muted">
          <Link href="/" className="hover:text-brand-600 transition-colors">
            홈
          </Link>
          <Link
            href="/novel/create"
            className="hover:text-brand-600 transition-colors flex items-center gap-1"
          >
            <PenTool size={18} aria-hidden />
            소설 쓰기
          </Link>
          
          {!loading && (
            user ? (
              <>
                <Link href="/profile/setup" className="hover:text-brand-600 transition-colors flex items-center gap-1">
                  <User size={18} aria-hidden />
                  {user.user_metadata?.nickname || user.user_metadata?.full_name || "프로필 설정"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 hover:text-red-600 transition-colors"
                >
                  <LogOut size={18} aria-hidden />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/signup" className="hover:text-brand-600 transition-colors hidden sm:inline">
                  회원가입
                </Link>
                <Link
                  href="/login"
                  className="flex items-center gap-1 hover:text-brand-600 transition-colors"
                >
                  <User size={18} aria-hidden />
                  로그인
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
