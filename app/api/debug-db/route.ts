import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const prisma = getPrisma();
  const dbUrl = process.env.DATABASE_URL || "MISSING";
  
  // 보안을 위해 비밀번호 일부 마스킹
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ":****@");

  try {
    // 단순 쿼리 실행 시도
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "connected",
      message: "Database connection successful!",
      url_used: maskedUrl
    });
  } catch (error: any) {
    console.error("Debug DB Error:", error);
    
    return NextResponse.json({
      status: "failed",
      error: error.message,
      code: error.code,
      meta: error.meta,
      url_used: maskedUrl,
      hint: "Check if your IP is allowed in Supabase and if the password is correctly encoded."
    }, { status: 500 });
  }
}
