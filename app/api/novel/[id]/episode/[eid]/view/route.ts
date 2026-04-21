import { NextRequest, NextResponse } from "next/server";
import { incrementEpisodeViews } from "@/lib/novel-service";

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

    await incrementEpisodeViews(novelId, episodeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Episode view increment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
