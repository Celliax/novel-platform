import { NextResponse } from "next/server";
import { recommendComment } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const commentId = Number(id);
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recommends = await recommendComment(commentId);
    return NextResponse.json({ recommends });
  } catch (error) {
    console.error("Comment recommend error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
