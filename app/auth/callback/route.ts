import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // next 파라미터가 있으면 해당 경로로, 없으면 메인 페이지로 이동
  let next = searchParams.get("next") ?? "/";

  // Render와 같은 프록시 환경에서는 x-forwarded-host 헤더를 확인해야 실제 도메인(fptnovel.onrender.com)을 알 수 있습니다.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  
  let baseUrl = origin;
  if (!isLocalEnv && forwardedHost) {
    baseUrl = `https://${forwardedHost}`;
  }

  if (code) {
    const supabase = await getSupabaseServerClient();
    
    // 발급받은 인증 코드를 세션(쿠키)으로 교환
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.session?.user) {
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: data.session.user.id }
      });

      // 만약 DB에 유저 정보가 없거나 프로필 설정이 완료되지 않았다면 프로필 설정 페이지로 강제 이동
      if (!user || !user.isProfileComplete) {
        next = "/profile/setup";
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // 인증 코드가 없거나 교환에 실패한 경우 로그인 페이지로 에러와 함께 리다이렉트
  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_failed`);
}
