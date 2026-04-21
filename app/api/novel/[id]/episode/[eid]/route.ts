import { NextRequest, NextResponse } from "next/server";
import { getEpisode } from "@/lib/novel-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  try {
    const { id, eid } = await params;
    const novelId = parseInt(id);
    const episodeId = parseInt(eid);

    if (isNaN(novelId) || isNaN(episodeId)) {
      return NextResponse.json({ error: "유효하지 않은 ID입니다." }, { status: 400 });
    }

    const episode = await getEpisode(novelId, episodeId);

    if (!episode) {
      return NextResponse.json({ error: "회차를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ episode });
  } catch (error) {
    console.error("회차 조회 오류:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
