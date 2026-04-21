"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNovel, getTags } from "@/lib/novel-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function createNovelAction(input: {
  title: string;
  genre: string;
  synopsis: string;
  ageRating: string;
  tagIds: number[];
  coverImage?: string;
}) {
  // Supabase에서 사용자 정보 가져오기
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // Ensure user exists in Prisma DB before creating novel
  const prisma = (await import("@/lib/prisma")).getPrisma();
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email || "",
      nickname: user.user_metadata?.nickname || user.email?.split('@')[0] || "User",
    }
  });

  const title = input.title.trim();
  const genre = input.genre.trim();
  const synopsis = input.synopsis?.trim() || "";
  const ageRating = input.ageRating;

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
  let novel;
  try {
    novel = await createNovel({
      title,
      authorId: user.id,
      genre,
      synopsis,
      ageRating,
      tags: selectedTags,
      coverImage: input.coverImage,
    });
  } catch (error: any) {
    console.error("createNovelAction Error:", error);
    throw new Error(error.message || "소설 생성 중 오류가 발생했습니다.");
  }

  if (!novel) {
    throw new Error("소설 생성에 실패했습니다.");
  }

  revalidatePath("/");
  redirect(`/novel/${novel.id}`);
}
