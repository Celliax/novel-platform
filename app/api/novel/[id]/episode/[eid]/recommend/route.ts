import { NextRequest, NextResponse } from "next/server";
import { incrementEpisodeRecommends } from "@/lib/novel-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; eid: string }> }
) {
  try {
    const { id, eid } = await params;
    const novelId = parseInt(id);
    const episodeId = parseInt(eid);

    if (isNaN(novelId) || isNaN(episodeId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await incrementEpisodeRecommends(novelId, episodeId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Recommend error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
