import { getPrisma } from './lib/prisma';
const prisma = getPrisma();
async function main() {
  try {
    const novel = await prisma.novel.create({
      data: {
        title: "Test Novel",
        authorId: "some-uuid", // This will probably fail FK constraint
        genre: "판타지",
        synopsis: "test",
        ageRating: "전체 이용가",
      }
    });
    console.log(novel);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
