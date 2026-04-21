import { NextResponse } from "next/server";
import { handleCommentVote } from "@/lib/novel-service";
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

    const result = await handleCommentVote(commentId, session.user.id, 'recommend');
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment recommend error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
