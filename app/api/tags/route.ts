import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// 모든 태그 가져오기
export async function GET() {
  try {
    const tags = await getPrisma().tag.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("태그 조회 오류:", error);
    return NextResponse.json(
      { error: "태그를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 새 태그 생성
export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "태그 이름을 입력해주세요." },
        { status: 400 }
      );
    }

    // 태그가 이미 존재하는지 확인
    const existingTag = await getPrisma().tag.findUnique({
      where: { name: name.trim() },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "이미 존재하는 태그입니다.", tag: existingTag },
        { status: 409 }
      );
    }

    // 새 태그 생성
    const tag = await getPrisma().tag.create({
      data: {
        name: name.trim(),
        color: color || "#6B7280",
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("태그 생성 오류:", error);
    return NextResponse.json(
      { error: "태그 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}