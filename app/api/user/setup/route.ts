import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { nickname, gender } = body;

    const prisma = getPrisma();
    
    // upsert로 해당 아이디의 유저가 있으면 업데이트, 없으면 생성
    const user = await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        name: nickname,
        gender: gender,
        isProfileComplete: true,
      },
      create: {
        id: session.user.id,
        email: session.user.email ?? "",
        name: nickname,
        gender: gender,
        avatar: session.user.user_metadata?.avatar_url,
        isProfileComplete: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile Setup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
