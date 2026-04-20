import { NextResponse } from "next/server";
import { createReport } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, targetId, reason } = await request.json();
    if (!type || !targetId || !reason) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const report = await createReport({
      type,
      targetId: Number(targetId),
      userId: session.user.id,
      reason,
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Report POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
