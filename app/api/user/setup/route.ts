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
    const { nickname, gender, age, avatar } = body;

    const prisma = getPrisma();

    // DB 업데이트 및 프로필 완료 상태 변경 (upsert를 사용하여 없으면 생성)
    const user = await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        nickname,
        gender,
        age: age ? Number(age) : null,
        avatar,
        isProfileComplete: true,
      },
      create: {
        id: session.user.id,
        email: session.user.email || "",
        nickname,
        gender,
        age: age ? Number(age) : null,
        avatar,
        isProfileComplete: true,
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile Setup Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}