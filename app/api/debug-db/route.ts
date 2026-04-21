import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { listNovelsForHome } from "@/lib/novel-service";

export async function GET() {
  const prisma = getPrisma();
  const dbUrl = process.env.DATABASE_URL || "MISSING";
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ":****@");

  try {
    // 1. 단순 연결 테스트
    await prisma.$queryRaw`SELECT 1`;
    
    // 2. 실제 데이터 패칭 테스트
    let novels = [];
    try {
      novels = await listNovelsForHome();
    } catch (fetchError: any) {
      return NextResponse.json({
        status: "connected_but_fetch_failed",
        message: "DB connection OK, but listNovelsForHome failed.",
        fetch_error: fetchError.message,
        url_used: maskedUrl
      }, { status: 500 });
    }
    
    return NextResponse.json({
      status: "success",
      message: "Everything is working!",
      novel_count: novels.length,
      url_used: maskedUrl
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "failed",
      error: error.message,
      url_used: maskedUrl
    }, { status: 500 });
  }
}
