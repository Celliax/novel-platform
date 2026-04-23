import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/prisma";

const prisma = getPrisma();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const novelId = parseInt(id);
    const { score } = await req.json();

    if (isNaN(novelId) || !score || score < 1 || score > 5) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Upsert rating
    await prisma.rating.upsert({
      where: {
        userId_novelId: {
          userId: user.id,
          novelId,
        }
      },
      update: { score },
      create: {
        userId: user.id,
        novelId,
        score,
      }
    });

    // 2. Calculate new average
    const aggregations = await prisma.rating.aggregate({
      where: { novelId },
      _avg: { score: true },
      _count: { score: true }
    });

    const avgRating = aggregations._avg.score || 0;

    // 3. Update novel with new average
    await prisma.novel.update({
      where: { id: novelId },
      data: { rating: avgRating }
    });

    return NextResponse.json({ 
      success: true, 
      avgRating: parseFloat(avgRating.toFixed(1)),
      count: aggregations._count.score
    });
  } catch (error) {
    console.error("Rating error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
