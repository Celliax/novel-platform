import { NextRequest, NextResponse } from "next/server";
import { getTags } from "@/lib/novel-service";

// 모든 태그 가져오기
export async function GET() {
  try {
    const tags = await getTags();

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("태그 조회 오류:", error);
    return NextResponse.json(
      { error: "태그를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}