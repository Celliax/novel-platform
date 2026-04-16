"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
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

  // 사용자 정보가 DB에 없는 경우 생성
  let dbUser = await getPrisma().user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    dbUser = await getPrisma().user.create({
      data: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        avatar: user.user_metadata?.avatar_url,
      },
    });
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

  // 소설 생성
  const novel = await getPrisma().novel.create({
    data: {
      title,
      authorId: user.id,
      genre,
      synopsis,
      rating: 0,
      views: 0,
      tags: {
        create: input.tagIds.map(tagId => ({
          tagId,
        })),
      },
    },
  });

  revalidatePath("/");
  redirect(`/novel/${novel.id}`);
}
