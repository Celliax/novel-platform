"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createEpisodeAction(input: {
  novelId: number;
  chapterNo: number;
  title: string;
  content: string;
}) {
  // Supabase에서 사용자 정보 가져오기
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 작품 존재 확인 및 권한 체크
  const novel = await getPrisma().novel.findUnique({
    where: { id: input.novelId },
    include: { episodes: true },
  });

  if (!novel) {
    throw new Error("작품을 찾을 수 없습니다.");
  }

  if (novel.authorId !== user.id) {
    throw new Error("이 작품의 작가만 회차를 추가할 수 있습니다.");
  }

  // 회차 번호 중복 체크
  const existingEpisode = await getPrisma().episode.findUnique({
    where: {
      novelId_chapterNo: {
        novelId: input.novelId,
        chapterNo: input.chapterNo,
      },
    },
  });

  if (existingEpisode) {
    throw new Error(`회차 ${input.chapterNo}는 이미 존재합니다.`);
  }

  const title = input.title.trim();
  const content = input.content?.trim() || "<p></p>";

  if (!title) {
    throw new Error("회차 제목을 입력해주세요.");
  }

  if (!content || content === "<p></p>") {
    throw new Error("회차 내용을 입력해주세요.");
  }

  // 회차 생성
  const episode = await getPrisma().episode.create({
    data: {
      novelId: input.novelId,
      chapterNo: input.chapterNo,
      title,
      content,
    },
  });

  revalidatePath(`/novel/${input.novelId}`);
  redirect(`/novel/${input.novelId}`);
}