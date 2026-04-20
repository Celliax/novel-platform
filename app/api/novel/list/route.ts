import { NextResponse } from "next/server";
import { listNovelsForHome } from "@/lib/novel-service";

export async function GET() {
  try {
    const novels = await listNovelsForHome();
    return NextResponse.json({ novels });
  } catch (error) {
    console.error("Novel list error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
