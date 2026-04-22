"use server";

import { runFullMigration } from "@/lib/migration";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function migrateAllImagesAction() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 보안을 위해 로그인이 되어 있는지 확인 (실제 운영시에는 관리자 계정 체크가 필요함)
  if (!user) {
    throw new Error("관리자 권한이 필요합니다.");
  }

  try {
    const result = await runFullMigration();
    return { success: true, result };
  } catch (error: any) {
    console.error("Migration Action Error:", error);
    throw new Error(error.message || "마이그레이션 중 오류가 발생했습니다.");
  }
}
