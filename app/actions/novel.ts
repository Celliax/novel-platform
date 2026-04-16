"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";

export async function createNovelAction(input: {
  title: string;
  genre: string;
  synopsis: string;
  author?: string;
}) {
  const title = input.title.trim();
  const genre = input.genre.trim();
  const author = (input.author?.trim() || "익명").slice(0, 120);
  const synopsis = input.synopsis?.trim() || "<p></p>";

  if (!title || !genre) {
    throw new Error("제목과 장르는 필수입니다.");
  }

  const novel = await getPrisma().novel.create({
    data: {
      title,
      author,
      genre,
      synopsis,
      rating: 0,
      views: 0,
    },
  });

  revalidatePath("/");
  redirect(`/novel/${novel.id}`);
}
