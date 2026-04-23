import "dotenv/config";
import { getPrisma } from "../lib/prisma";

const prisma = getPrisma();

const DEFAULT_TAGS = [
  { name: "판타지", color: "#3B82F6" },
  { name: "무협", color: "#EF4444" },
  { name: "현대", color: "#10B981" },
  { name: "로맨스", color: "#EC4899" },
  { name: "하렘", color: "#FF69B4" },
  { name: "아카데미", color: "#F59E0B" },
  { name: "회귀", color: "#6366F1" },
  { name: "빙의", color: "#14B8A6" },
  { name: "환생", color: "#F97316" },
  { name: "먼치킨", color: "#9333EA" },
  { name: "TS", color: "#475569" },
  { name: "성장물", color: "#84CC16" },
  { name: "일상", color: "#06B6D4" },
  { name: "힐링", color: "#A855F7" },
  { name: "공포", color: "#1F2937" },
  { name: "스릴러", color: "#2563EB" },
  { name: "대체역사", color: "#92400E" },
  { name: "인터넷방송", color: "#DC2626" },
  { name: "게임", color: "#DB2777" },
  { name: "SF", color: "#059669" },
  { name: "피폐", color: "#000000" },
  { name: "후회", color: "#FF6666" },
  { name: "집착", color: "#FFB7C5" },
  { name: "역키잡", color: "#10B981" },
  { name: "성좌", color: "#FFA500" },
  { name: "탑", color: "#CC6699" },
  { name: "암컷타락", color: "#000000" },
  { name: "얀데레", color: "#FF0000" },
  { name: "멘헤라", color: "#FF0000" },
  { name: "용사", color: "#2563EB" },
  { name: "중세", color: "#A52A2A" }
];

async function main() {
  console.log("Seed 시작...");

  // 기본 태그 생성 (이미 있으면 건너뜀)
  console.log("기본 태그 생성 중...");
  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {},
      create: {
        name: tag.name,
        color: tag.color,
      },
    });
  }

  console.log("Seed 완료!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
