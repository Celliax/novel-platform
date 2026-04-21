import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Force creating ALL tables from schema.prisma...');
  
  try {
    // Drop existing tables to start clean
    console.log('Cleaning up existing tables...');
    const tables = ['Report', 'CommentVote', 'Comment', 'UserFavorite', 'UserTagRead', 'NovelTag', 'Episode', 'Novel', 'Tag', 'User'];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }

    // 1. User
    console.log('Creating User table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "nickname" TEXT,
        "avatar" TEXT,
        "gender" TEXT,
        "age" INTEGER,
        "bio" TEXT,
        "isPrivate" BOOLEAN NOT NULL DEFAULT false,
        "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);

    // 2. Tag
    console.log('Creating Tag table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Tag" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT UNIQUE NOT NULL,
        "color" TEXT NOT NULL DEFAULT '#6B7280'
      )
    `);

    // 3. Novel
    console.log('Creating Novel table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Novel" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        "genre" TEXT NOT NULL,
        "coverImage" TEXT NOT NULL DEFAULT '/placeholder-cover.svg',
        "views" INTEGER NOT NULL DEFAULT 0,
        "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "synopsis" TEXT NOT NULL,
        "ageRating" TEXT NOT NULL DEFAULT '전체 이용가',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Novel_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // 4. Episode
    console.log('Creating Episode table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Episode" (
        "id" SERIAL PRIMARY KEY,
        "novelId" INTEGER NOT NULL,
        "chapterNo" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "image" TEXT,
        "views" INTEGER NOT NULL DEFAULT 0,
        "recommends" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Episode_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Episode_novelId_chapterNo_key" ON "Episode"("novelId", "chapterNo")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX "Episode_novelId_idx" ON "Episode"("novelId")`);

    // 5. NovelTag
    console.log('Creating NovelTag table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "NovelTag" (
        "novelId" INTEGER NOT NULL,
        "tagId" INTEGER NOT NULL,
        PRIMARY KEY ("novelId", "tagId"),
        CONSTRAINT "NovelTag_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "NovelTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // 6. UserTagRead
    console.log('Creating UserTagRead table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "UserTagRead" (
        "userId" TEXT NOT NULL,
        "tagId" INTEGER NOT NULL,
        "count" INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY ("userId", "tagId"),
        CONSTRAINT "UserTagRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UserTagRead_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // 7. UserFavorite
    console.log('Creating UserFavorite table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "UserFavorite" (
        "userId" TEXT NOT NULL,
        "novelId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("userId", "novelId"),
        CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "UserFavorite_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // 8. Comment
    console.log('Creating Comment table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Comment" (
        "id" SERIAL PRIMARY KEY,
        "novelId" INTEGER NOT NULL,
        "episodeId" INTEGER,
        "userId" TEXT NOT NULL,
        "userName" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "recommends" INTEGER NOT NULL DEFAULT 0,
        "dislikes" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Comment_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // 9. CommentVote
    console.log('Creating CommentVote table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "CommentVote" (
        "userId" TEXT NOT NULL,
        "commentId" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("userId", "commentId"),
        CONSTRAINT "CommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // 10. Report
    console.log('Creating Report table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Report" (
        "id" SERIAL PRIMARY KEY,
        "type" TEXT NOT NULL,
        "targetId" INTEGER NOT NULL,
        "userId" TEXT NOT NULL,
        "reason" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('All tables created from schema.prisma successfully!');
  } catch (error) {
    console.error('Failed to create tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
