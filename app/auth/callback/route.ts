import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    let next = url.searchParams.get("next") ?? "/";

    // Render와 같은 프록시 환경에서는 x-forwarded-host 헤더를 확인해야 실제 도메인(fptnovel.onrender.com)을 알 수 있습니다.
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    
    if (!isLocalEnv && forwardedHost) {
      url.host = forwardedHost.split(',')[0].trim();
      url.protocol = "https:";
      url.port = "";
    }

    if (code) {
      const supabase = await getSupabaseServerClient();
      
      // 발급받은 인증 코드를 세션(쿠키)으로 교환
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data?.session?.user) {
        const prisma = getPrisma();
        
        // 데이터베이스에 유저가 있는지 확인
        let user = null;
        try {
          user = await prisma.user.findUnique({
            where: { id: data.session.user.id }
          });
        } catch (dbError) {
          console.error("Prisma findUnique error:", dbError);
          // DB 에러가 발생해도 일단 로그인은 성공했으니 프로필 설정으로 보내도록 처리
        }

        // 만약 DB에 유저 정보가 없거나 프로필 설정이 완료되지 않았다면 프로필 설정 페이지로 강제 이동
        if (!user || !user.isProfileComplete) {
          next = "/profile/setup";
        }

        return NextResponse.redirect(new URL(next, url.origin));
      } else {
        console.error("Supabase exchangeCodeForSession error:", error);
      }
    }

    // 인증 코드가 없거나 교환에 실패한 경우 로그인 페이지로 에러와 함께 리다이렉트
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", url.origin));
  } catch (err) {
    console.error("Fatal Auth Callback Error:", err);
    // 가장 바깥쪽에서 에러가 날 경우에도 어떻게든 로그인 폼으로 돌아가게 방어
    return NextResponse.redirect(new URL("/login?error=fatal_auth_error", request.url));
  }
}
