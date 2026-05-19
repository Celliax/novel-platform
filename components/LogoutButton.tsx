"use client";

import { LogOut } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1 hover:text-red-600 transition-colors"
    >
      <LogOut size={18} aria-hidden />
      로그아웃
    </button>
  );
}
