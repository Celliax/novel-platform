import fs from 'fs';
import path from 'path';
import { getPrisma } from './prisma';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Novel {
  id: number;
  title: string;
  authorId: string;
  author: User;
  genre: string;
  coverImage: string;
  views: number;
  rating: number;
  synopsis: string;
  ageRating: string;
  createdAt: string;
  updatedAt: string;
  episodes: Episode[];
  tags: NovelTag[];
}

export interface Episode {
  id: number;
  novelId: number;
  novel: Novel;
  chapterNo: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  createdAt: string;
}

export interface NovelTag {
  novelId: number;
  tagId: number;
  novel: Novel;
  tag: Tag;
}

export interface UserTagRead {
  userId: string;
  tagId: number;
  readCount: number;
  user: User;
  tag: Tag;
}

interface Database {
  users: User[];
  novels: Novel[];
  episodes: Episode[];
  tags: Tag[];
  novelTags: NovelTag[];
  userTagReads: UserTagRead[];
  comments: Comment[];
  reports: Report[];
}

export interface Comment {
  id: number;
  novelId: number;
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

function populateRelations() {
  database.novels.forEach(novel => {
    novel.author = database.users.find(u => u.id === novel.authorId)!;
    novel.episodes = database.episodes.filter(e => e.novelId === novel.id);
    novel.tags = database.novelTags.filter(nt => nt.novelId === novel.id);
  });

  database.episodes.forEach(episode => {
    episode.novel = database.novels.find(n => n.id === episode.novelId)!;
  });

  database.novelTags.forEach(nt => {
    nt.novel = database.novels.find(n => n.id === nt.novelId)!;
    nt.tag = database.tags.find(t => t.id === nt.tagId)!;
  });

  database.userTagReads.forEach(utr => {
    utr.user = database.users.find(u => u.id === utr.userId)!;
    utr.tag = database.tags.find(t => t.id === utr.tagId)!;
  });
}

populateRelations();

export type NovelWithAuthor = Novel & { author: User };

export async function listNovelsForHome(): Promise<NovelWithAuthor[]> {
  database = loadDatabase();
  populateRelations();
  return database.novels.map(novel => ({
    ...novel,
    author: novel.author,
  }));
}

export async function getNovelWithEpisodes(id: number): Promise<Novel | null> {
  try {
    database = loadDatabase();
    populateRelations();
    const novel = database.novels.find(n => n.id === id);
    if (!novel) return null;

    return {
      ...novel,
      episodes: database.episodes
        .filter(e => e.novelId === id)
        .sort((a, b) => a.chapterNo - b.chapterNo),
    };
  } catch (error) {
    console.error("getNovelWithEpisodes error:", error);
    return null;
  }
}

export async function getEpisode(novelId: number, episodeId: number): Promise<Episode | null> {
  return database.episodes.find(e => e.novelId === novelId && e.id === episodeId) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  return database.users.find(u => u.id === id) || null;
}

export async function getUserTagStats(userId: string): Promise<{ tag: Tag; count: number }[]> {
  const userReads = database.userTagReads.filter(utr => utr.userId === userId);
  return userReads.map(utr => ({
    tag: utr.tag,
    count: utr.readCount,
  })).sort((a, b) => b.count - a.count);
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
    author,
    genre: data.genre,
    coverImage: data.coverImage || '/placeholder-cover.svg',
    views: 0,
    rating: 0,
    synopsis: data.synopsis,
    ageRating: data.ageRating,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    episodes: [],
    tags: [],
  };

  database.novels.push(newNovel);

  data.tags.forEach(tagName => {
    let tag = database.tags.find(t => t.name === tagName);
    if (!tag) {
      tag = {
        id: Math.max(...database.tags.map(t => t.id), 0) + 1,
        name: tagName,
        color: "#6B7280", // 기본 색상 추가
        createdAt: new Date().toISOString(),
      };
      database.tags.push(tag);
    }

    database.novelTags.push({
      novelId: newNovel.id,
      tagId: tag.id,
      novel: newNovel,
      tag,
    });
  });

  saveDatabase(database);
  populateRelations();

  return newNovel;
}

export async function createEpisode(data: {
  novelId: number;
  chapterNo: number;
  title: string;
  content: string;
}): Promise<Episode> {
  const novel = database.novels.find(n => n.id === data.novelId);
  if (!novel) {
    throw new Error('소설을 찾을 수 없습니다.');
  }

  const newEpisode: Episode = {
    id: Math.max(...database.episodes.map(e => e.id), 0) + 1,
    novelId: data.novelId,
    novel,
    chapterNo: data.chapterNo,
    title: data.title,
    content: data.content,
    createdAt: new Date().toISOString(),
  };

  database.episodes.push(newEpisode);
  saveDatabase(database);
  populateRelations();

  return newEpisode;
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
  populateRelations();
  return database.novels.filter(novel => novel.authorId === userId);
}

export async function getComments(novelId: number): Promise<Comment[]> {
  return (database.comments || []).filter(c => c.novelId === novelId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createComment(data: { novelId: number, userId: string, userName: string, content: string }): Promise<Comment> {
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

export async function recommendComment(commentId: number): Promise<number> {
  const comment = (database.comments || []).find(c => c.id === commentId);
  if (!comment) throw new Error('댓글을 찾을 수 없습니다.');
  comment.recommends = (comment.recommends || 0) + 1;
  saveDatabase(database);
  return comment.recommends;
}

export async function dislikeComment(commentId: number): Promise<number> {
  const comment = (database.comments || []).find(c => c.id === commentId);
  if (!comment) throw new Error('댓글을 찾을 수 없습니다.');
  comment.dislikes = (comment.dislikes || 0) + 1;
  saveDatabase(database);
  return comment.dislikes;
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