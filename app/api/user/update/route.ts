import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { avatar } = body;

    const prisma = getPrisma();
    
    // DB 업데이트
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { ...(avatar && { avatar }) },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("User Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
