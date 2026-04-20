import { NextRequest, NextResponse } from "next/server";
import { getTags, createTag, getTagByName } from "@/lib/novel-service";

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
  let name = "";
  try {
    const body = await request.json();
    name = body.name;
    const color = body.color;
    if (!name) {
      return NextResponse.json({ error: "태그 이름은 필수입니다." }, { status: 400 });
    }
    const tag = await createTag(name, color);
    return NextResponse.json({ tag });
  } catch (error: any) {
    if (error.message === '이미 존재하는 태그입니다.') {
      // 기존 태그 반환 — TagSelector 에서 data.tag 로 접근하므로 반드시 포함
      const existingTag = error.existingTag || (await getTagByName(name));
      return NextResponse.json({ error: error.message, tag: existingTag }, { status: 409 });
    }
    return NextResponse.json({ error: "태그 추가에 실패했습니다." }, { status: 500 });
  }
}