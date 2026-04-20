import { NextRequest, NextResponse } from "next/server";
import { checkTitleAvailable } from "@/lib/novel-service";

// GET /api/novel/check-title?title=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim();

  if (!title) {
    return NextResponse.json({ available: false, error: "제목이 필요합니다." }, { status: 400 });
  }

  try {
    const available = await checkTitleAvailable(title);
    return NextResponse.json({ available });
  } catch {
    return NextResponse.json({ available: true });
  }
}
