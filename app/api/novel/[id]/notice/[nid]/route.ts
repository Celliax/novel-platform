import { NextRequest, NextResponse } from "next/server";
import { getNotice, incrementNoticeViews } from "@/lib/novel-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nid: string }> }
) {
  try {
    const { id, nid } = await params;
    const novelId = parseInt(id);
    const noticeId = parseInt(nid);

    if (isNaN(novelId) || isNaN(noticeId)) {
      return NextResponse.json({ error: "유효하지 않은 ID입니다." }, { status: 400 });
    }

    const notice = await getNotice(novelId, noticeId);

    if (!notice) {
      return NextResponse.json({ error: "공지사항을 찾을 수 없습니다." }, { status: 404 });
    }

    // 조회수 증가
    await incrementNoticeViews(noticeId);

    return NextResponse.json({ notice });
  } catch (error) {
    console.error("공지 조회 오류:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
