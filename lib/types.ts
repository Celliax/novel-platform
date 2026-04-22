export interface User {
  id: string;
  email: string;
  name?: string;
  nickname?: string;
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
  isSideStory: boolean;
  title: string;
  content?: string;
  image?: string;
  authorNote?: string;
  views: number;
  recommends: number;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
}

export interface Comment {
  id: number;
  novelId: number;
  episodeId?: number;
  userId: string;
  userName: string;
  content: string;
  recommends: number;
  dislikes: number;
  episodeNo?: number;
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

export interface Notice {
  id: number;
  novelId: number;
  title: string;
  content: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export type NovelWithAuthor = Novel & { author: User };
