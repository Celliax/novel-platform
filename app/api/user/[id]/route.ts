import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // 사용자 정보 가져오기
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 사용자의 소설들 가져오기
    const novels = await getPrisma().novel.findMany({
      where: { authorId: userId },
      include: {
        episodes: {
          select: {
            id: true,
            chapterNo: true,
            title: true,
            createdAt: true,
          },
          orderBy: { chapterNo: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 사용자가 읽은 태그 통계 가져오기
    const tagStats = await getPrisma().userTagRead.findMany({
      where: { userId },
      include: {
        tag: true,
      },
      orderBy: { count: "desc" },
      take: 5,
    });

    return NextResponse.json({
      user,
      novels,
      tagStats: tagStats.map(stat => ({
        tag: stat.tag,
        count: stat.count,
      })),
    });
  } catch (error) {
    console.error("사용자 데이터 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}