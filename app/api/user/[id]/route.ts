import { NextRequest, NextResponse } from "next/server";
import { getUserById, getUserTagStats, getUserNovels } from "@/lib/novel-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // 사용자 정보 가져오기
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 사용자의 소설들 가져오기
    const novels = await getUserNovels(userId);

    // 사용자가 읽은 태그 통계 가져오기
    const tagStats = await getUserTagStats(userId);

    return NextResponse.json({
      user,
      novels,
      tagStats: tagStats.slice(0, 5), // 상위 5개만
    });
  } catch (error) {
    console.error("사용자 데이터 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}