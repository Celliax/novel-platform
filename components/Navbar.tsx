import Link from "next/link";
import { BookOpen, PenTool, User } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

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
          
          {user ? (
            <>
              <Link href="/profile" className="hover:text-brand-600 transition-colors flex items-center gap-1">
                <User size={18} aria-hidden />
                {user.user_metadata?.nickname || user.user_metadata?.full_name || "프로필"}
              </Link>
              <LogoutButton />
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
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
