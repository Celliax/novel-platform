import { PrismaClient } from '../lib/generated/prisma';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const DB_PATH = path.join(process.cwd(), 'data.json');

async function migrate() {
  if (!fs.existsSync(DB_PATH)) {
    console.log('data.json not found. Nothing to migrate.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  console.log('Starting migration...');

  // 1. Tags
  if (data.tags) {
    for (const tag of data.tags) {
      await prisma.tag.upsert({
        where: { id: tag.id },
        update: { name: tag.name },
        create: { id: tag.id, name: tag.name }
      });
    }
    console.log(`Migrated ${data.tags.length} tags.`);
  }

  // 2. Users
  if (data.users) {
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: { 
          email: user.email,
          nickname: user.nickname || user.name,
          avatar: user.avatar,
          age: user.age
        },
        create: {
          id: user.id,
          email: user.email,
          nickname: user.nickname || user.name,
          avatar: user.avatar,
          age: user.age,
          isProfileComplete: true
        }
      });
    }
    console.log(`Migrated ${data.users.length} users.`);
  }

  // 3. Novels
  if (data.novels) {
    for (const novel of data.novels) {
      await prisma.novel.upsert({
        where: { id: novel.id },
        update: {
          title: novel.title,
          authorId: novel.authorId,
          genre: novel.genre,
          coverImage: novel.coverImage,
          views: novel.views,
          rating: Number(novel.rating),
          synopsis: novel.synopsis,
          ageRating: novel.ageRating || "전체 이용가"
        },
        create: {
          id: novel.id,
          title: novel.title,
          authorId: novel.authorId,
          genre: novel.genre,
          coverImage: novel.coverImage,
          views: novel.views,
          rating: Number(novel.rating),
          synopsis: novel.synopsis,
          ageRating: novel.ageRating || "전체 이용가"
        }
      });
    }
    console.log(`Migrated ${data.novels.length} novels.`);
  }

  // 4. Episodes
  if (data.episodes) {
    for (const ep of data.episodes) {
      await prisma.episode.upsert({
        where: { id: ep.id },
        update: {
          novelId: ep.novelId,
          chapterNo: ep.chapterNo,
          title: ep.title,
          content: ep.content,
          image: ep.image,
          views: ep.views,
          recommends: ep.recommends
        },
        create: {
          id: ep.id,
          novelId: ep.novelId,
          chapterNo: ep.chapterNo,
          title: ep.title,
          content: ep.content,
          image: ep.image,
          views: ep.views,
          recommends: ep.recommends
        }
      });
    }
    console.log(`Migrated ${data.episodes.length} episodes.`);
  }

  // 5. NovelTags
  if (data.novelTags) {
    for (const nt of data.novelTags) {
      await prisma.novelTag.upsert({
        where: { novelId_tagId: { novelId: nt.novelId, tagId: nt.tagId } },
        update: {},
        create: { novelId: nt.novelId, tagId: nt.tagId }
      });
    }
    console.log(`Migrated ${data.novelTags.length} novel-tag relations.`);
  }

  // 6. Comments
  if (data.comments) {
    for (const c of data.comments) {
      await prisma.comment.upsert({
        where: { id: c.id },
        update: {
          content: c.content,
          recommends: c.recommends,
          dislikes: c.dislikes
        },
        create: {
          id: c.id,
          novelId: c.novelId,
          episodeId: c.episodeId,
          userId: c.userId,
          userName: c.userName,
          content: c.content,
          recommends: c.recommends,
          dislikes: c.dislikes,
          createdAt: new Date(c.createdAt)
        }
      });
    }
    console.log(`Migrated ${data.comments.length} comments.`);
  }

  // 7. CommentVotes
  if (data.commentVotes) {
    for (const v of data.commentVotes) {
      await prisma.commentVote.upsert({
        where: { userId_commentId: { userId: v.userId, commentId: v.commentId } },
        update: { type: v.type },
        create: {
          userId: v.userId,
          commentId: v.commentId,
          type: v.type
        }
      });
    }
    console.log(`Migrated ${data.commentVotes.length} comment votes.`);
  }

  console.log('Migration completed successfully!');
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
