import { NextRequest, NextResponse } from "next/server";
import { getTags, createTag } from "@/lib/novel-service";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;
    if (!name) {
      return NextResponse.json({ error: "태그 이름은 필수입니다." }, { status: 400 });
    }
    const tag = await createTag(name, color);
    return NextResponse.json({ tag });
  } catch (error: any) {
    if (error.message === '이미 존재하는 태그입니다.') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "태그 추가에 실패했습니다." }, { status: 500 });
  }
}