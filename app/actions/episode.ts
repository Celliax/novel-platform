"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEpisode, updateEpisode, getNovelWithEpisodes, getEpisode } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createEpisodeAction(input: {
  novelId: number;
  chapterNo: number;
  title: string;
  content: string;
  image?: string;
  image?: string;
  authorNote?: string;
  isSideStory?: boolean;
}) {
  // Supabase에서 사용자 정보 가져오기
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 작품 존재 확인 및 권한 체크
  const novel = await getNovelWithEpisodes(input.novelId);

  if (!novel) {
    throw new Error("작품을 찾을 수 없습니다.");
  }

  if (novel.authorId !== user.id) {
    throw new Error("이 작품의 작가만 회차를 추가할 수 있습니다.");
  }

  // 회차 번호 중복 체크
  const existingEpisode = novel.episodes.find(e => e.chapterNo === input.chapterNo);
  if (existingEpisode) {
    throw new Error(`회차 ${input.chapterNo}는 이미 존재합니다.`);
  }

  // 회차 생성
  await createEpisode({
    novelId: input.novelId,
    chapterNo: input.chapterNo,
    title: input.title,
    content: input.content,
    image: input.image,
    authorNote: input.authorNote,
    isSideStory: input.isSideStory,
  });

  revalidatePath(`/novel/${input.novelId}`);
  redirect(`/novel/${input.novelId}`);
}

export async function updateEpisodeAction(input: {
  id: number;
  novelId: number;
  title: string;
  content: string;
  image?: string;
  image?: string;
  authorNote?: string;
  isSideStory?: boolean;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  const episode = await getEpisode(input.novelId, input.id);
  if (!episode) throw new Error("회차를 찾을 수 없습니다.");

  const novel = await getNovelWithEpisodes(input.novelId);
  if (!novel || novel.authorId !== user.id) {
    throw new Error("수정 권한이 없습니다.");
  }

  await updateEpisode(input.id, {
    title: input.title,
    content: input.content,
    image: input.image,
    authorNote: input.authorNote,
    isSideStory: input.isSideStory,
  });

  revalidatePath(`/novel/${input.novelId}`);
  revalidatePath(`/novel/${input.novelId}/episode/${input.id}`);
  redirect(`/novel/${input.novelId}`);
}