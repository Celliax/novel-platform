import { NextRequest, NextResponse } from "next/server";
import { getNovelWithEpisodes, incrementNovelViews, getFavoriteCount } from "@/lib/novel-service";

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

    await incrementNovelViews(novelId);
    const novel = await getNovelWithEpisodes(novelId);
    const favoriteCount = await getFavoriteCount(novelId);

    if (!novel) {
      return NextResponse.json(
        { error: "작품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      novel: {
        id: novel.id,
        title: novel.title,
        authorId: novel.authorId,
        author: novel.author,
        genre: novel.genre,
        coverImage: novel.coverImage,
        views: novel.views,
        rating: novel.rating,
        synopsis: novel.synopsis,
        ageRating: novel.ageRating,
        episodes: novel.episodes.map(episode => ({
          id: episode.id,
          chapterNo: episode.chapterNo,
          title: episode.title,
        })),
        tags: novel.tags,
        commentCount: novel.commentCount,
        favoriteCount: favoriteCount,
      },
    });
  } catch (error) {
    console.error("작품 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}