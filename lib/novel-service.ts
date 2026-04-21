"use server";

import { getPrisma } from './prisma';
import { 
  User, Novel, Episode, Tag, Comment, Report, NovelWithAuthor 
} from './types';

// Prisma Helper
const prisma = getPrisma();

export async function listNovelsForHome() {
  const novels = await prisma.novel.findMany({
    include: {
      author: true,
      episodes: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return novels.map(novel => {
    const totalViews = novel.episodes.reduce((sum, ep) => sum + (ep.views || 0), 0);
    const totalRecommends = novel.episodes.reduce((sum, ep) => sum + (ep.recommends || 0), 0);
    
    return {
      id: novel.id,
      title: novel.title,
      authorId: novel.authorId,
      genre: novel.genre,
      coverImage: novel.coverImage,
      views: totalViews,
      rating: totalRecommends,
      synopsis: novel.synopsis,
      ageRating: novel.ageRating,
      createdAt: novel.createdAt.toISOString(),
      updatedAt: novel.updatedAt.toISOString(),
      author: {
        id: novel.author.id,
        email: novel.author.email,
        name: novel.author.nickname || "작자미상",
        nickname: novel.author.nickname || undefined,
        avatar: novel.author.avatar || undefined,
        age: novel.author.age || undefined,
        createdAt: novel.author.createdAt.toISOString(),
        updatedAt: novel.author.updatedAt.toISOString(),
      },
    };
  });
}

export async function handleCommentVote(commentId: number, userId: string, type: 'recommend' | 'dislike'): Promise<{ success: boolean; message?: string }> {
  const existingVote = await prisma.commentVote.findUnique({
    where: { userId_commentId: { userId, commentId } }
  });

  if (existingVote) {
    return { success: false, message: "이미 참여하셨습니다." };
  }

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return { success: false, message: "댓글을 찾을 수 없습니다." };

  await prisma.$transaction([
    prisma.commentVote.create({
      data: { userId, commentId, type }
    }),
    prisma.comment.update({
      where: { id: commentId },
      data: {
        recommends: type === 'recommend' ? { increment: 1 } : undefined,
        dislikes: type === 'dislike' ? { increment: 1 } : undefined,
      }
    })
  ]);

  return { success: true };
}

export async function getNovelWithEpisodes(id: number) {
  const novel = await prisma.novel.findUnique({
    where: { id },
    include: {
      author: true,
      episodes: {
        orderBy: { chapterNo: 'asc' }
      },
      tags: {
        include: { tag: true }
      }
    }
  });

  if (!novel) return null;

  const totalViews = novel.episodes.reduce((sum, ep) => sum + (ep.views || 0), 0);
  const totalRecommends = novel.episodes.reduce((sum, ep) => sum + (ep.recommends || 0), 0);
  const commentCount = await prisma.comment.count({ where: { novelId: id } });

  return {
    id: novel.id,
    title: novel.title,
    authorId: novel.authorId,
    genre: novel.genre,
    coverImage: novel.coverImage,
    views: totalViews,
    rating: totalRecommends,
    synopsis: novel.synopsis,
    ageRating: novel.ageRating,
    createdAt: novel.createdAt.toISOString(),
    updatedAt: novel.updatedAt.toISOString(),
    author: {
      id: novel.author.id,
      email: novel.author.email,
      name: novel.author.nickname || "작자미상",
      nickname: novel.author.nickname || undefined,
      avatar: novel.author.avatar || undefined,
      age: novel.author.age || undefined,
      createdAt: novel.author.createdAt.toISOString(),
      updatedAt: novel.author.updatedAt.toISOString(),
    },
    episodes: novel.episodes.map(ep => ({
      id: ep.id,
      novelId: ep.novelId,
      chapterNo: ep.chapterNo,
      title: ep.title,
      content: ep.content,
      image: ep.image || undefined,
      authorNote: ep.authorNote || undefined,
      views: ep.views,
      recommends: ep.recommends,
      createdAt: ep.createdAt.toISOString(),
    })),
    tags: novel.tags.map(nt => ({
      id: nt.tag.id,
      name: nt.tag.name,
      color: nt.tag.color,
    })),
    commentCount
  };
}

export async function incrementEpisodeViews(novelId: number, episodeId: number) {
  await prisma.episode.update({
    where: { id: episodeId },
    data: { views: { increment: 1 } }
  });
}

export async function incrementEpisodeRecommends(novelId: number, episodeId: number) {
  await prisma.episode.update({
    where: { id: episodeId },
    data: { recommends: { increment: 1 } }
  });
}

export async function getFavoriteCount(novelId: number): Promise<number> {
  return prisma.userFavorite.count({
    where: { novelId }
  });
}

export async function getEpisode(novelId: number, episodeId: number): Promise<Episode | null> {
  const ep = await prisma.episode.findFirst({
    where: { id: episodeId, novelId }
  });
  if (!ep) return null;
  return {
    id: ep.id,
    novelId: ep.novelId,
    chapterNo: ep.chapterNo,
    title: ep.title,
    content: ep.content,
    image: ep.image || undefined,
    authorNote: ep.authorNote || undefined,
    views: ep.views,
    recommends: ep.recommends,
    createdAt: ep.createdAt.toISOString(),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const prismaUser = await prisma.user.findUnique({ where: { id } });
  if (!prismaUser) return null;

  return {
    id: prismaUser.id,
    email: prismaUser.email,
    name: prismaUser.nickname || "작자미상",
    nickname: prismaUser.nickname || undefined,
    avatar: prismaUser.avatar || undefined,
    age: prismaUser.age || undefined,
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString(),
  };
}

export async function getUserTagStats(userId: string): Promise<{ tag: Tag; count: number }[]> {
  const userReads = await prisma.userTagRead.findMany({
    where: { userId },
    include: { tag: true },
    orderBy: { count: 'desc' }
  });

  return userReads.map(utr => ({
    tag: {
      id: utr.tag.id,
      name: utr.tag.name,
      color: utr.tag.color,
    },
    count: utr.count,
  }));
}

export async function getTags(): Promise<Tag[]> {
  const tags = await prisma.tag.findMany();
  return tags.map(t => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }));
}

export async function checkTitleAvailable(title: string): Promise<boolean> {
  const count = await prisma.novel.count({ where: { title } });
  return count === 0;
}

export async function createTag(name: string, color: string = "#6B7280"): Promise<Tag> {
  const tag = await prisma.tag.create({
    data: { name, color }
  });
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  };
}

export async function getTagByName(name: string): Promise<Tag | null> {
  const tag = await prisma.tag.findUnique({ where: { name } });
  if (!tag) return null;
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
  };
}

export async function createNovel(data: {
  title: string;
  authorId: string;
  genre: string;
  synopsis: string;
  ageRating: string;
  tags: string[];
  coverImage?: string;
}): Promise<Novel> {
  const novel = await prisma.novel.create({
    data: {
      title: data.title,
      authorId: data.authorId,
      genre: data.genre,
      synopsis: data.synopsis,
      ageRating: data.ageRating,
      coverImage: data.coverImage || '/placeholder-cover.svg',
      tags: {
        create: await Promise.all(data.tags.map(async (tagName) => {
          let tag = await prisma.tag.findUnique({ where: { name: tagName } });
          if (!tag) {
            tag = await prisma.tag.create({ data: { name: tagName } });
          }
          return { tagId: tag.id };
        }))
      }
    }
  });

  return {
    id: novel.id,
    title: novel.title,
    authorId: novel.authorId,
    genre: novel.genre,
    coverImage: novel.coverImage,
    views: novel.views,
    rating: novel.rating,
    synopsis: novel.synopsis,
    ageRating: novel.ageRating,
    createdAt: novel.createdAt.toISOString(),
    updatedAt: novel.updatedAt.toISOString(),
  };
}

export async function createEpisode(data: {
  novelId: number;
  chapterNo: number;
  title: string;
  content: string;
  image?: string;
  authorNote?: string;
}): Promise<Episode> {
  const ep = await prisma.episode.create({
    data: {
      novelId: data.novelId,
      chapterNo: data.chapterNo,
      title: data.title,
      content: data.content,
      image: data.image,
      authorNote: data.authorNote,
    }
  });

  return {
    id: ep.id,
    novelId: ep.novelId,
    chapterNo: ep.chapterNo,
    title: ep.title,
    content: ep.content,
    image: ep.image || undefined,
    authorNote: ep.authorNote || undefined,
    views: ep.views,
    recommends: ep.recommends,
    createdAt: ep.createdAt.toISOString(),
  };
}

export async function updateEpisode(id: number, data: {
  title?: string;
  content?: string;
  image?: string;
  authorNote?: string;
  chapterNo?: number;
}): Promise<Episode> {
  const ep = await prisma.episode.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      image: data.image,
      authorNote: data.authorNote,
      chapterNo: data.chapterNo,
    }
  });

  return {
    id: ep.id,
    novelId: ep.novelId,
    chapterNo: ep.chapterNo,
    title: ep.title,
    content: ep.content,
    image: ep.image || undefined,
    authorNote: ep.authorNote || undefined,
    views: ep.views,
    recommends: ep.recommends,
    createdAt: ep.createdAt.toISOString(),
  };
}

export async function getEpisodeNavigation(
  novelId: number,
  episodeId: number,
) {
  const novel = await prisma.novel.findUnique({ where: { id: novelId } });
  if (!novel) return null;

  const episode = await prisma.episode.findUnique({ where: { id: episodeId } });
  if (!episode || episode.novelId !== novelId) return null;

  const prev = await prisma.episode.findFirst({
    where: { novelId, chapterNo: { lt: episode.chapterNo } },
    orderBy: { chapterNo: 'desc' }
  });

  const next = await prisma.episode.findFirst({
    where: { novelId, chapterNo: { gt: episode.chapterNo } },
    orderBy: { chapterNo: 'asc' }
  });

  return {
    novel: {
      id: novel.id,
      title: novel.title,
      authorId: novel.authorId,
      genre: novel.genre,
      coverImage: novel.coverImage,
      views: novel.views,
      rating: novel.rating,
      synopsis: novel.synopsis,
      ageRating: novel.ageRating,
      createdAt: novel.createdAt.toISOString(),
      updatedAt: novel.updatedAt.toISOString(),
    },
    episode: {
      id: episode.id,
      novelId: episode.novelId,
      chapterNo: episode.chapterNo,
      title: episode.title,
      content: episode.content,
      image: episode.image || undefined,
      authorNote: episode.authorNote || undefined,
      views: episode.views,
      recommends: episode.recommends,
      createdAt: episode.createdAt.toISOString(),
    },
    prev: prev ? {
      id: prev.id,
      chapterNo: prev.chapterNo,
      title: prev.title,
      createdAt: prev.createdAt.toISOString(),
    } : undefined,
    next: next ? {
      id: next.id,
      chapterNo: next.chapterNo,
      title: next.title,
      createdAt: next.createdAt.toISOString(),
    } : undefined,
  };
}

export async function getUserNovels(userId: string): Promise<Novel[]> {
  const novels = await prisma.novel.findMany({
    where: { authorId: userId },
    orderBy: { updatedAt: 'desc' }
  });

  return novels.map(n => ({
    id: n.id,
    title: n.title,
    authorId: n.authorId,
    genre: n.genre,
    coverImage: n.coverImage,
    views: n.views,
    rating: n.rating,
    synopsis: n.synopsis,
    ageRating: n.ageRating,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));
}

export async function getComments(novelId: number, episodeId?: number): Promise<Comment[]> {
  const comments = await prisma.comment.findMany({
    where: {
      novelId,
      episodeId: episodeId || undefined,
    },
    orderBy: { createdAt: 'desc' }
  });

  return Promise.all(comments.map(async (c) => {
    let episodeNo: number | undefined;
    if (c.episodeId) {
      const ep = await prisma.episode.findUnique({ where: { id: c.episodeId } });
      episodeNo = ep?.chapterNo;
    }
    return {
      id: c.id,
      novelId: c.novelId,
      episodeId: c.episodeId || undefined,
      userId: c.userId,
      userName: c.userName,
      content: c.content,
      recommends: c.recommends,
      dislikes: c.dislikes,
      episodeNo,
      createdAt: c.createdAt.toISOString(),
    };
  }));
}

export async function createComment(data: { 
  novelId: number, 
  episodeId?: number, 
  userId: string, 
  userName: string, 
  content: string 
}): Promise<Comment> {
  const comment = await prisma.comment.create({
    data: {
      novelId: data.novelId,
      episodeId: data.episodeId,
      userId: data.userId,
      userName: data.userName,
      content: data.content,
    }
  });

  return {
    id: comment.id,
    novelId: comment.novelId,
    episodeId: comment.episodeId || undefined,
    userId: comment.userId,
    userName: comment.userName,
    content: comment.content,
    recommends: comment.recommends,
    dislikes: comment.dislikes,
    createdAt: comment.createdAt.toISOString(),
  };
}

export async function createReport(data: { type: 'COMMENT' | 'NOVEL', targetId: number, userId: string, reason: string }): Promise<Report> {
  const report = await prisma.report.create({
    data: {
      type: data.type,
      targetId: data.targetId,
      userId: data.userId,
      reason: data.reason,
    }
  });

  return {
    id: report.id,
    type: report.type as 'COMMENT' | 'NOVEL',
    targetId: report.targetId,
    userId: report.userId,
    reason: report.reason,
    createdAt: report.createdAt.toISOString(),
  };
}