"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNovel, getTags } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createNovelAction(input: {
  title: string;
  genre: string;
  synopsis: string;
  tagIds: number[];
}) {
  // Supabase에서 사용자 정보 가져오기
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const title = input.title.trim();
  const genre = input.genre.trim();
  const synopsis = input.synopsis?.trim() || "<p></p>";

  if (!title || !genre) {
    throw new Error("제목과 장르는 필수입니다.");
  }

  if (input.tagIds.length === 0) {
    throw new Error("최소 1개의 태그를 선택해주세요.");
  }

  // 태그 이름들 가져오기
  const allTags = await getTags();
  const selectedTags = allTags
    .filter(tag => input.tagIds.includes(tag.id))
    .map(tag => tag.name);

  // 소설 생성
  const novel = await createNovel({
    title,
    authorId: user.id,
    genre,
    synopsis,
    tags: selectedTags,
  });

  revalidatePath("/");
  redirect(`/novel/${novel.id}`);
}
