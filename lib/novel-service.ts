import fs from 'fs';
import path from 'path';
import { getPrisma } from './prisma';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Novel {
  id: number;
  title: string;
  authorId: string;
  genre: string;
  coverImage: string;
  views: number;
  rating: number;
  synopsis: string;
  ageRating: string;
  createdAt: string;
  updatedAt: string;
}

export interface Episode {
  id: number;
  novelId: number;
  chapterNo: number;
  title: string;
  content: string;
  image?: string;
  views: number;
  recommends: number;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  createdAt: string;
}

export interface CommentVote {
  userId: string;
  commentId: number;
  type: 'recommend' | 'dislike';
}

export interface NovelTag {
  novelId: number;
  tagId: number;
}

export interface UserTagRead {
  userId: string;
  tagId: number;
  readCount: number;
}

interface Database {
  users: User[];
  novels: Novel[];
  episodes: Episode[];
  tags: Tag[];
  novelTags: NovelTag[];
  userTagReads: UserTagRead[];
  comments: Comment[];
  commentVotes: CommentVote[];
  reports: Report[];
}

export interface Comment {
  id: number;
  novelId: number;
  episodeId?: number; // 에피소드 댓글인 경우 추가
  userId: string;
  userName: string;
  content: string;
  recommends: number;
  dislikes: number;
  createdAt: string;
}

export interface Report {
  id: number;
  type: 'COMMENT' | 'NOVEL';
  targetId: number;
  userId: string;
  reason: string;
  createdAt: string;
}

const DB_PATH = path.join(process.cwd(), 'data.json');

const defaultData: Database = {
  users: [],
  novels: [],
  episodes: [],
  tags: [
    { id: 1, name: '판타지', createdAt: new Date().toISOString() },
    { id: 2, name: '현대판타지', createdAt: new Date().toISOString() },
    { id: 3, name: '로맨스', createdAt: new Date().toISOString() },
    { id: 4, name: '로맨스판타지', createdAt: new Date().toISOString() },
    { id: 5, name: '무협', createdAt: new Date().toISOString() },
    { id: 6, name: '일상', createdAt: new Date().toISOString() },
    { id: 7, name: '액션', createdAt: new Date().toISOString() },
    { id: 8, name: 'TS', createdAt: new Date().toISOString() },
  ],
  novelTags: [],
  userTagReads: [],
  comments: [],
  commentVotes: [],
  reports: [],
};

function loadDatabase(): Database {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...defaultData, ...parsed };
    }
  } catch (error) {
    console.error('데이터베이스 로드 실패:', error);
  }
  return defaultData;
}

function saveDatabase(data: Database): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('데이터베이스 저장 실패:', error);
  }
}

let database = loadDatabase();

// Relations are no longer populated in-place to avoid circular references and serialization errors.

export type NovelWithAuthor = Novel & { author: User };

export async function listNovelsForHome() {
  database = loadDatabase();
  return database.novels.map(novel => {
    const author = database.users.find(u => u.id === novel.authorId);
    const episodes = database.episodes.filter(e => e.novelId === novel.id);
    const totalViews = episodes.reduce((sum, ep) => sum + (ep.views || 0), 0);
    const totalRecommends = episodes.reduce((sum, ep) => sum + (ep.recommends || 0), 0);
    
    return {
      ...novel,
      views: totalViews,
      rating: totalRecommends,
      author: author!,
    };
  });
}

export async function handleCommentVote(commentId: number, userId: string, type: 'recommend' | 'dislike'): Promise<{ success: boolean; message?: string }> {
  database = loadDatabase();
  if (!database.commentVotes) database.commentVotes = [];
  
  // 이미 투표했는지 확인
  const existingVote = database.commentVotes.find(v => v.userId === userId && v.commentId === commentId);
  if (existingVote) {
    return { success: false, message: "이미 참여하셨습니다." };
  }

  const comment = database.comments?.find(c => c.id === commentId);
  if (!comment) return { success: false, message: "댓글을 찾을 수 없습니다." };

  if (type === 'recommend') {
    comment.recommends = (comment.recommends || 0) + 1;
  } else {
    comment.dislikes = (comment.dislikes || 0) + 1;
  }

  database.commentVotes.push({ userId, commentId, type });
  saveDatabase(database);
  return { success: true };
}

export async function getNovelWithEpisodes(id: number) {
  try {
    database = loadDatabase();
    const novel = database.novels.find(n => n.id === id);
    if (!novel) return null;

    // Prisma 동기화 확인 (선호작 등 기능 연동을 위해)
    try {
      const prisma = getPrisma();
      const prismaNovel = await prisma.novel.findUnique({ where: { id } });
      if (!prismaNovel) {
        await prisma.novel.create({
          data: {
            id: novel.id,
            title: novel.title,
            authorId: novel.authorId,
            genre: novel.genre,
            coverImage: novel.coverImage,
            views: novel.views,
            rating: Number(novel.rating),
            synopsis: novel.synopsis,
          }
        });
      }
    } catch (e) {
      console.error("Prisma JIT sync error:", e);
    }

    const author = database.users.find(u => u.id === novel.authorId);
    const episodes = database.episodes
      .filter(e => e.novelId === id)
      .sort((a, b) => a.chapterNo - b.chapterNo);
    const novelTags = database.novelTags.filter(nt => nt.novelId === id);
    const tags = novelTags.map(nt => database.tags.find(t => t.id === nt.tagId)).filter(Boolean) as Tag[];

    const totalViews = episodes.reduce((sum, ep) => sum + (ep.views || 0), 0);
    const totalRecommends = episodes.reduce((sum, ep) => sum + (ep.recommends || 0), 0);

    return {
      ...novel,
      views: totalViews, // 에피소드 조회수 합계로 덮어쓰기
      rating: totalRecommends, // 추천수 합계로 활용
      author: author!,
      episodes,
      tags,
      commentCount: (database.comments || []).filter(c => c.novelId === id).length
    };
  } catch (error) {
    console.error("getNovelWithEpisodes error:", error);
    return null;
  }
}

export async function incrementEpisodeViews(novelId: number, episodeId: number) {
  database = loadDatabase();
  const episode = database.episodes.find(e => e.novelId === novelId && e.id === episodeId);
  if (episode) {
    episode.views = (episode.views || 0) + 1;
    console.log(`[ViewInc] Novel:${novelId} Ep:${episodeId} -> ${episode.views}`);
    saveDatabase(database);
  } else {
    console.warn(`[ViewInc] Episode not found: Novel:${novelId} Ep:${episodeId}`);
  }
}

export async function incrementEpisodeRecommends(novelId: number, episodeId: number) {
  database = loadDatabase();
  const episode = database.episodes.find(e => e.novelId === novelId && e.id === episodeId);
  if (episode) {
    episode.recommends = (episode.recommends || 0) + 1;
    saveDatabase(database);
  }
}

export async function getFavoriteCount(novelId: number): Promise<number> {
  const prisma = getPrisma();
  return prisma.userFavorite.count({
    where: { novelId }
  });
}

export async function getEpisode(novelId: number, episodeId: number): Promise<Episode | null> {
  return database.episodes.find(e => e.novelId === novelId && e.id === episodeId) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  let user = database.users.find(u => u.id === id) || null;
  
  // 데이터베이스에 없거나 최신 정보를 위해 Prisma에서 확인
  const prisma = getPrisma();
  const prismaUser = await prisma.user.findUnique({ where: { id } });
  
  if (prismaUser) {
    const updatedUser: User = {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.nickname || "작자미상",
      avatar: prismaUser.avatar || undefined,
      age: prismaUser.age || undefined,
      createdAt: prismaUser.createdAt.toISOString(),
      updatedAt: prismaUser.updatedAt.toISOString(),
    };
    
    if (user) {
      const idx = database.users.findIndex(u => u.id === id);
      database.users[idx] = updatedUser;
    } else {
      database.users.push(updatedUser);
    }
    saveDatabase(database);
    return updatedUser;
  }
  
  return user;
}

export async function getUserTagStats(userId: string): Promise<{ tag: Tag; count: number }[]> {
  const userReads = database.userTagReads.filter(utr => utr.userId === userId);
  return userReads.map(utr => {
    const tag = database.tags.find(t => t.id === utr.tagId);
    return {
      tag: tag!,
      count: utr.readCount,
    };
  }).filter(item => item.tag).sort((a, b) => b.count - a.count);
}

export async function getTags(): Promise<Tag[]> {
  database = loadDatabase();
  return database.tags;
}

export async function checkTitleAvailable(title: string): Promise<boolean> {
  database = loadDatabase();
  const duplicate = database.novels.find(n => n.title === title);
  return !duplicate;
}

export async function createTag(name: string, color: string = "#6B7280"): Promise<Tag> {
  const existing = database.tags.find(t => t.name === name);
  if (existing) {
    throw Object.assign(new Error('이미 존재하는 태그입니다.'), { existingTag: existing });
  }
  const tag: Tag = {
    id: Math.max(...database.tags.map(t => t.id), 0) + 1,
    name,
    color,
    createdAt: new Date().toISOString(),
  };
  database.tags.push(tag);
  saveDatabase(database);
  return tag;
}

export async function getTagByName(name: string): Promise<Tag | null> {
  return database.tags.find(t => t.name === name) || null;
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
  // 제목 중복 체크
  const duplicate = database.novels.find(n => n.title === data.title);
  if (duplicate) {
    throw new Error('이미 같은 제목의 소설이 존재합니다. 다른 제목을 사용해주세요.');
  }

  let author = database.users.find(u => u.id === data.authorId);
  if (!author) {
    const prisma = getPrisma();
    const prismaUser = await prisma.user.findUnique({ where: { id: data.authorId } });
    if (prismaUser) {
      author = {
        id: data.authorId,
        email: prismaUser.email,
        name: prismaUser.nickname || "작자미상",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      database.users.push(author);
    } else {
      throw new Error('작가를 찾을 수 없습니다.');
    }
  }

  const newNovel: Novel = {
    id: Math.max(...database.novels.map(n => n.id), 0) + 1,
    title: data.title,
    authorId: data.authorId,
    genre: data.genre,
    coverImage: data.coverImage || '/placeholder-cover.svg',
    views: 0,
    rating: 0,
    synopsis: data.synopsis,
    ageRating: data.ageRating,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  database.novels.push(newNovel);

  // Prisma에도 소설 동기화 (선호작 기능을 위해 필요)
  try {
    const prisma = getPrisma();
    await prisma.novel.create({
      data: {
        id: newNovel.id,
        title: newNovel.title,
        authorId: newNovel.authorId,
        genre: newNovel.genre,
        coverImage: newNovel.coverImage,
        views: newNovel.views,
        rating: Number(newNovel.rating),
        synopsis: newNovel.synopsis,
      }
    });
  } catch (error) {
    console.error("Prisma novel creation error:", error);
    // 이미 존재하는 경우는 무시하거나 업데이트할 수 있음
  }

  data.tags.forEach(tagName => {
    let tag = database.tags.find(t => t.name === tagName);
    if (!tag) {
      tag = {
        id: Math.max(...database.tags.map(t => t.id), 0) + 1,
        name: tagName,
        color: "#6B7280",
        createdAt: new Date().toISOString(),
      };
      database.tags.push(tag);
    }

    database.novelTags.push({
      novelId: newNovel.id,
      tagId: tag.id,
    });
  });

  saveDatabase(database);
  return newNovel;
}

export async function createEpisode(data: {
  novelId: number;
  chapterNo: number;
  title: string;
  content: string;
  image?: string;
}): Promise<Episode> {
  const novel = database.novels.find(n => n.id === data.novelId);
  if (!novel) {
    throw new Error('소설을 찾을 수 없습니다.');
  }

  const newEpisode: Episode = {
    id: Math.max(...database.episodes.map(e => e.id), 0) + 1,
    novelId: data.novelId,
    chapterNo: data.chapterNo,
    title: data.title,
    content: data.content,
    image: data.image,
    views: 0,
    recommends: 0,
    createdAt: new Date().toISOString(),
  };

  database.episodes.push(newEpisode);
  saveDatabase(database);

  return newEpisode;
}

export async function getEpisodeNavigation(
  novelId: number,
  episodeId: number,
) {
  const novel = database.novels.find(n => n.id === novelId);
  if (!novel) return null;

  const episode = database.episodes.find(e => e.id === episodeId && e.novelId === novelId);
  if (!episode) return null;

  const siblings = database.episodes
    .filter(e => e.novelId === novelId)
    .sort((a, b) => a.chapterNo - b.chapterNo);

  const idx = siblings.findIndex(e => e.id === episodeId);
  if (idx === -1) return null;

  return {
    novel,
    episode,
    prev: siblings[idx - 1],
    next: siblings[idx + 1],
  };
}

export async function getUserNovels(userId: string): Promise<Novel[]> {
  database = loadDatabase();
  return database.novels.filter(novel => novel.authorId === userId);
}

export async function getComments(novelId: number, episodeId?: number): Promise<Comment[]> {
  database = loadDatabase();
  return (database.comments || [])
    .filter(c => {
      const matchNovel = c.novelId === novelId;
      if (episodeId) {
        return matchNovel && c.episodeId === episodeId;
      }
      // episodeId가 없으면 해당 소설의 모든 댓글(회차 댓글 포함)을 반환
      return matchNovel;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createComment(data: { 
  novelId: number, 
  episodeId?: number, 
  userId: string, 
  userName: string, 
  content: string 
}): Promise<Comment> {
  database = loadDatabase();
  if (!database.comments) database.comments = [];
  const newComment: Comment = {
    id: Math.max(...database.comments.map(c => c.id), 0) + 1,
    ...data,
    recommends: 0,
    dislikes: 0,
    createdAt: new Date().toISOString(),
  };
  database.comments.push(newComment);
  saveDatabase(database);
  return newComment;
}


export async function createReport(data: { type: 'COMMENT' | 'NOVEL', targetId: number, userId: string, reason: string }): Promise<Report> {
  if (!database.reports) database.reports = [];
  const newReport: Report = {
    id: Math.max(...database.reports.map(r => r.id), 0) + 1,
    ...data,
    createdAt: new Date().toISOString(),
  };
  database.reports.push(newReport);
  saveDatabase(database);
  return newReport;
}