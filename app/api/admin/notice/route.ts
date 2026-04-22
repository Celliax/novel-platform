import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_ID } from "@/lib/constants";
import { createSystemNotice } from "@/lib/novel-service";

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== ADMIN_ID) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { title, content, isImportant } = await req.json();
    const notice = await createSystemNotice(title, content, isImportant);
    return NextResponse.json({ success: true, notice });
  } catch (error) {
    return NextResponse.json({ error: "공지 등록 실패" }, { status: 500 });
  }
}
