import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('Attempting to fix schema manually...');
  
  try {
    // 1. User 테이블 확인 및 필요한 경우 필드 수정 (이미 있을 수 있음)
    // 2. Novel 테이블에 authorId 컬럼 추가
    console.log('Adding authorId to Novel table...');
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Novel' AND column_name='authorId') THEN
          ALTER TABLE "Novel" ADD COLUMN "authorId" TEXT;
        END IF;
      END $$;
    `);

    // 3. 기존 데이터가 있다면 기본값 설정 (가장 오래된 유저 또는 임의 유저)
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      console.log(`Setting default authorId to ${firstUser.id}...`);
      await prisma.$executeRawUnsafe(`UPDATE "Novel" SET "authorId" = '${firstUser.id}' WHERE "authorId" IS NULL`);
    }

    // 4. NOT NULL 제약 조건 및 외래 키 설정
    console.log('Setting constraints...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "Novel" ALTER COLUMN "authorId" SET NOT NULL`);
    
    // 외래키는 이미 있을 수 있으므로 체크 후 추가
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='Novel_authorId_fkey') THEN
          ALTER TABLE "Novel" ADD CONSTRAINT "Novel_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('Schema fix completed successfully!');
  } catch (error) {
    console.error('Failed to fix schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
