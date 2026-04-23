import { NextResponse } from "next/server";
import { getComments, createComment } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const novelId = Number(id);
    const comments = await getComments(novelId);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Comments GET error:", error);
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

    const { content, parentId } = await request.json();
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // 최신 닉네임 정보를 위해 getUserById 호출
    const { getUserById } = await import("@/lib/novel-service");
    const user = await getUserById(session.user.id);
    const userName = user?.nickname || user?.name || session.user.user_metadata?.nickname || session.user.email?.split('@')[0] || "작자미상";

    const comment = await createComment({
      novelId,
      userId: session.user.id,
      userName,
      content,
      parentId: parentId ? Number(parentId) : undefined,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Comment POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
