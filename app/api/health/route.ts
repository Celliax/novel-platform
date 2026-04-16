import { NextResponse } from "next/server";

export async function GET() {
  const hasDb = Boolean(process.env.DATABASE_URL);
  return NextResponse.json({
    ok: true,
    databaseConfigured: hasDb,
  });
}
