"use client";

import Link from "next/link";
import { BookOpen, PenTool, User } from "lucide-react";

export default function Navbar() {
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
        </div>
      </div>
    </nav>
  );
}
