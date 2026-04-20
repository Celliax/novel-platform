import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const novelId = Number(id);
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ isFavorited: false });
    }

    const prisma = getPrisma();
    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error("Favorite GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const novelId = Number(id);
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrisma();
    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_novelId: {
          userId: session.user.id,
          novelId,
        },
      },
    });

    if (existing) {
      // 삭제
      await prisma.userFavorite.delete({
        where: {
          userId_novelId: {
            userId: session.user.id,
            novelId,
          },
        },
      });
      return NextResponse.json({ isFavorited: false });
    } else {
      // 추가
      await prisma.userFavorite.create({
        data: {
          userId: session.user.id,
          novelId,
        },
      });
      return NextResponse.json({ isFavorited: true });
    }
  } catch (error) {
    console.error("Favorite POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
