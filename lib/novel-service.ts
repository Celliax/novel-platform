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
}

const DB_PATH = path.join(process.cwd(), 'data.json');

const defaultData: Database = {
  users: [
    {
      id: 'test-user-1',
      email: 'author1@example.com',
      name: '임정희',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'test-user-2',
      email: 'author2@example.com',
      name: '김민수',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  novels: [
    {
      id: 1,
      title: '회생한 마왕의 일상',
      authorId: 'test-user-1',
      author: {
        id: 'test-user-1',
        email: 'author1@example.com',
        name: '임정희',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      genre: '판타지',
      coverImage: '/placeholder-cover.svg',
      views: 125000,
      rating: 4.8,
      synopsis: '<p>한때 세계를 뒤흔든 마왕이 조용한 마을에서 빵 굽는 삶을 선택했다. 그런데 과거 부하들이 하나둘 찾아오기 시작한다.</p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      episodes: [],
      tags: [],
    },
    {
      id: 2,
      title: '나만 아는 던전',
      authorId: 'test-user-2',
      author: {
        id: 'test-user-2',
        email: 'author2@example.com',
        name: '김민수',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      genre: '액션',
      coverImage: '/placeholder-cover.svg',
      views: 203000,
      rating: 4.6,
      synopsis: '<p>던전 탐험가로 살아가는 청년의 이야기. 다른 사람은 모르는 던전의 비밀을 간직한 채 모험을 계속한다.</p>',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      episodes: [],
      tags: [],
    },
  ],
  episodes: [
    {
      id: 1,
      novelId: 1,
      novel: {} as Novel,
      chapterNo: 1,
      title: '프롤로그 — 오븐 앞의 마왕',
      content: '<p>새벽 빵 냄새가 마을 골목을 감쌌다. 루시안은 밀가루 묻은 손으로 오븐 문을 열었다.</p><p><strong>「오늘은 호밀빵이다.」</strong></p><p>그의 목소리는 더 이상 군대를 움직이지 않았지만, 여전히 사람의 마음을 움직일 줄 알았다.</p>',
      createdAt: new Date().toISOString(),
    },
  ],
  tags: [
    { id: 1, name: '판타지', createdAt: new Date().toISOString() },
    { id: 2, name: '로맨스', createdAt: new Date().toISOString() },
    { id: 3, name: '액션', createdAt: new Date().toISOString() },
    { id: 4, name: '일상', createdAt: new Date().toISOString() },
    { id: 5, name: '모험', createdAt: new Date().toISOString() },
  ],
  novelTags: [
    { novelId: 1, tagId: 1, novel: {} as Novel, tag: {} as Tag },
    { novelId: 1, tagId: 4, novel: {} as Novel, tag: {} as Tag },
    { novelId: 2, tagId: 3, novel: {} as Novel, tag: {} as Tag },
    { novelId: 2, tagId: 5, novel: {} as Novel, tag: {} as Tag },
  ],
  userTagReads: [],
};

function loadDatabase(): Database {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
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
  return database.novels.map(novel => ({
    ...novel,
    author: novel.author,
  }));
}

export async function getNovelWithEpisodes(id: number): Promise<Novel | null> {
  const novel = database.novels.find(n => n.id === id);
  if (!novel) return null;

  return {
    ...novel,
    episodes: database.episodes
      .filter(e => e.novelId === id)
      .sort((a, b) => a.chapterNo - b.chapterNo),
  };
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
  return database.tags;
}

export async function createTag(name: string, color: string = "#6B7280"): Promise<Tag> {
  let tag = database.tags.find(t => t.name === name);
  if (tag) {
    throw new Error('이미 존재하는 태그입니다.');
  }
  tag = {
    id: Math.max(...database.tags.map(t => t.id), 0) + 1,
    name,
    color,
    createdAt: new Date().toISOString(),
  };
  database.tags.push(tag);
  saveDatabase(database);
  return tag;
}

export async function createNovel(data: {
  title: string;
  authorId: string;
  genre: string;
  synopsis: string;
  tags: string[];
}): Promise<Novel> {
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
    coverImage: '/placeholder-cover.svg',
    views: 0,
    rating: 0,
    synopsis: data.synopsis,
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
  return database.novels.filter(novel => novel.authorId === userId);
}