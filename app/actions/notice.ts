"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNotice, getNovelWithEpisodes } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createNoticeAction(input: {
  novelId: number;
  title: string;
  content: string;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  const novel = await getNovelWithEpisodes(input.novelId);
  if (!novel || novel.authorId !== user.id) {
    throw new Error("공지 등록 권한이 없습니다.");
  }

  await createNotice({
    novelId: input.novelId,
    title: input.title,
    content: input.content,
  });

  revalidatePath(`/novel/${input.novelId}`);
  redirect(`/novel/${input.novelId}`);
}
