import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Listing all tables in public schema...');
  try {
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables found:', tables.map(t => t.table_name));
  } catch (error) {
    console.error('Failed to list tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
