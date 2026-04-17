import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // next 파라미터가 있으면 해당 경로로, 없으면 메인 페이지로 이동
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await getSupabaseServerClient();
    
    // 발급받은 인증 코드를 세션(쿠키)으로 교환
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 인증 코드가 없거나 교환에 실패한 경우 로그인 페이지로 에러와 함께 리다이렉트
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
