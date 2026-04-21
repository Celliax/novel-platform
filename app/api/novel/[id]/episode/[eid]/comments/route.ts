import { NextRequest, NextResponse } from "next/server";
import { getComments, createComment } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  try {
    const { id, eid } = await params;
    const novelId = parseInt(id);
    const episodeId = parseInt(eid);

    if (isNaN(novelId) || isNaN(episodeId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const comments = await getComments(novelId, episodeId);
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Episode comments GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  try {
    const { id, eid } = await params;
    const novelId = parseInt(id);
    const episodeId = parseInt(eid);

    if (isNaN(novelId) || isNaN(episodeId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    }

    // 최신 닉네임 정보를 위해 getUserById 호출
    const { getUserById } = await import("@/lib/novel-service");
    const dbUser = await getUserById(user.id);
    const userName = dbUser?.nickname || dbUser?.name || user.user_metadata?.nickname || user.email?.split('@')[0] || "작자미상";

    const comment = await createComment({
      novelId,
      episodeId,
      userId: user.id,
      userName,
      content,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Episode comments POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
