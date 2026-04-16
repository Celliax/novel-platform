import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const novelId = parseInt(id);

    if (isNaN(novelId)) {
      return NextResponse.json(
        { error: "유효하지 않은 작품 ID입니다." },
        { status: 400 }
      );
    }

    const novel = await getPrisma().novel.findUnique({
      where: { id: novelId },
      include: {
        episodes: {
          orderBy: { chapterNo: "asc" },
          select: {
            id: true,
            chapterNo: true,
            title: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!novel) {
      return NextResponse.json(
        { error: "작품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 응답 형식 맞추기
    const response = {
      id: novel.id,
      title: novel.title,
      authorId: novel.authorId,
      author: novel.author.name || novel.author.email,
      genre: novel.genre,
      coverImage: novel.coverImage,
      views: novel.views,
      rating: novel.rating,
      synopsis: novel.synopsis,
      episodes: novel.episodes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("작품 조회 오류:", error);
    return NextResponse.json(
      { error: "작품을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}