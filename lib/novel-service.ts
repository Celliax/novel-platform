import type { Episode, Novel } from "@/lib/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export type NovelWithEpisodes = Novel & { episodes: Episode[] };

function isDbConnectionError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const anyErr = err as { code?: unknown; message?: unknown; meta?: unknown };
  if (anyErr.code === "ECONNREFUSED") return true;
  if (typeof anyErr.message === "string" && anyErr.message.includes("ECONNREFUSED")) return true;
  return false;
}

export type NovelWithAuthor = Novel & {
  author: {
    name: string | null;
    email: string;
  };
};

export async function listNovelsForHome(): Promise<NovelWithAuthor[]> {
  try {
    return await getPrisma().novel.findMany({
      orderBy: { id: "asc" },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (err) {
    // 개발 환경에서 DB가 아직 준비되지 않은 경우(로컬 postgres 미기동 등)
    if (isDbConnectionError(err)) return [];
    throw err;
  }
}

export async function getNovelWithEpisodes(id: number): Promise<NovelWithEpisodes | null> {
  try {
    return await getPrisma().novel.findUnique({
      where: { id },
      include: {
        episodes: { orderBy: { chapterNo: "asc" } },
      },
    });
  } catch (err) {
    if (isDbConnectionError(err)) return null;
    throw err;
  }
}

export async function getEpisodeNavigation(
  novelId: number,
  episodeId: number,
): Promise<{
  novel: Novel;
  episode: Episode;
  prev?: Episode;
  next?: Episode;
} | null> {
  try {
    const prisma = getPrisma();
    const episode = await prisma.episode.findFirst({
      where: { id: episodeId, novelId },
      include: { novel: true },
    });
    if (!episode) return null;

    const { novel, ...ep } = episode;
    const siblings = await prisma.episode.findMany({
      where: { novelId },
      orderBy: { chapterNo: "asc" },
    });
    const idx = siblings.findIndex((e: Episode) => e.id === episodeId);
    if (idx === -1) return null;

    return {
      novel,
      episode: ep,
      prev: siblings[idx - 1],
      next: siblings[idx + 1],
    };
  } catch (err) {
    if (isDbConnectionError(err)) return null;
    throw err;
  }
}
