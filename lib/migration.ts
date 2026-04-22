import { uploadBase64Image } from "./storage";
import { getPrisma } from "./prisma";

/**
 * HTML 본문 내의 모든 Base64 이미지를 찾아 Cloudinary로 업로드하고 URL로 치환합니다.
 */
async function migrateContentImages(content: string): Promise<string> {
  let newContent = content;
  // <img src="data:image/..." /> 형태의 태그를 찾습니다.
  const base64Regex = /<img[^>]+src="([^">]+)"/g;
  let match;

  while ((match = base64Regex.exec(content)) !== null) {
    const fullTag = match[0];
    const src = match[1];

    if (src.startsWith("data:image")) {
      try {
        console.log("Migrating embedded content image...");
        const newUrl = await uploadBase64Image(src);
        newContent = newContent.replace(src, newUrl);
      } catch (error) {
        console.error("Failed to migrate content image:", error);
      }
    }
  }

  return newContent;
}

/**
 * 모든 소설과 회차를 돌며 Base64 이미지를 Cloudinary로 마이그레이션합니다.
 */
export async function runFullMigration() {
  const prisma = getPrisma();
  let migratedNovels = 0;
  let migratedEpisodes = 0;
  let migratedContentImages = 0;

  console.log("Starting full migration...");

  // 1. 소설 표지 마이그레이션
  const novels = await prisma.novel.findMany({
    where: { coverImage: { startsWith: "data:image" } }
  });

  for (const novel of novels) {
    try {
      const newUrl = await uploadBase64Image(novel.coverImage);
      await prisma.novel.update({
        where: { id: novel.id },
        data: { coverImage: newUrl }
      });
      migratedNovels++;
      console.log(`Migrated novel cover: ${novel.id}`);
    } catch (e) {
      console.error(`Failed to migrate novel ${novel.id}:`, e);
    }
  }

  // 2. 회차 삽화 및 본문 이미지 마이그레이션
  const episodes = await prisma.episode.findMany();

  for (const ep of episodes) {
    let updatedData: any = {};
    let needsUpdate = false;

    // 회차 메인 삽화
    if (ep.image && ep.image.startsWith("data:image")) {
      try {
        const newUrl = await uploadBase64Image(ep.image);
        updatedData.image = newUrl;
        needsUpdate = true;
        migratedEpisodes++;
        console.log(`Migrated episode image: ${ep.id}`);
      } catch (e) {
        console.error(`Failed to migrate episode image ${ep.id}:`, e);
      }
    }

    // 회차 본문 속 이미지들
    if (ep.content.includes("data:image")) {
      try {
        const newContent = await migrateContentImages(ep.content);
        if (newContent !== ep.content) {
          updatedData.content = newContent;
          needsUpdate = true;
          migratedContentImages++;
          console.log(`Migrated episode content images: ${ep.id}`);
        }
      } catch (e) {
        console.error(`Failed to migrate episode content ${ep.id}:`, e);
      }
    }

    if (needsUpdate) {
      await prisma.episode.update({
        where: { id: ep.id },
        data: updatedData
      });
    }
  }

  return {
    novels: migratedNovels,
    episodes: migratedEpisodes,
    contentImages: migratedContentImages
  };
}
