import "dotenv/config";
import { getPrisma } from "../lib/prisma";

const prisma = getPrisma();

const DEFAULT_TAGS = [
  // 장르 대분류
  { name: "판타지", color: "#3B82F6" },
  { name: "무협", color: "#EF4444" },
  { name: "현대", color: "#10B981" },
  { name: "로맨스", color: "#EC4899" },
  { name: "하렘", color: "#FF69B4" },
  { name: "SF", color: "#059669" },
  { name: "공포", color: "#1F2937" },
  { name: "스릴러", color: "#2563EB" },
  { name: "미스터리", color: "#4B5563" },
  { name: "추리", color: "#0D9488" },
  { name: "라이트노벨", color: "#DB2777" },
  
  // 인기 키워드 (시스템/설정)
  { name: "아카데미", color: "#F59E0B" },
  { name: "회귀", color: "#6366F1" },
  { name: "빙의", color: "#14B8A6" },
  { name: "환생", color: "#F97316" },
  { name: "먼치킨", color: "#9333EA" },
  { name: "헌터물", color: "#4F46E5" },
  { name: "레이드물", color: "#7C3AED" },
  { name: "성좌물", color: "#FCD34D" },
  { name: "탑등반물", color: "#6B7280" },
  { name: "게임판타지", color: "#10B981" },
  { name: "퓨전판타지", color: "#8B5CF6" },
  { name: "선협", color: "#DC2626" },
  
  // 주인공 성향/특징
  { name: "천재", color: "#0EA5E9" },
  { name: "전문가", color: "#475569" },
  { name: "성장물", color: "#84CC16" },
  { name: "착각물", color: "#F472B6" },
  { name: "TS", color: "#FF66CC" },
  { name: "역키잡", color: "#10B981" },
  { name: "집착", color: "#FFB7C5" },
  { name: "후회", color: "#FF6666" },
  { name: "피폐", color: "#000000" },
  { name: "얀데레", color: "#FF0000" },
  { name: "멘헤라", color: "#FF0000" },
  { name: "용사", color: "#2563EB" },
  { name: "암컷타락", color: "#000000" },
  
  // 소재/배경
  { name: "재벌", color: "#D4AF37" },
  { name: "경영", color: "#0D9488" },
  { name: "영지물", color: "#92400E" },
  { name: "대체역사", color: "#B45309" },
  { name: "중세", color: "#A52A2A" },
  { name: "메디컬", color: "#06B6D4" },
  { name: "법정", color: "#1E293B" },
  { name: "연예계", color: "#C026D3" },
  { name: "아이돌", color: "#E879F9" },
  { name: "인터넷방송", color: "#DC2626" },
  { name: "전쟁", color: "#7F1D1D" },
  { name: "밀리터리", color: "#365314" },
  
  // 스포츠
  { name: "축구", color: "#166534" },
  { name: "야구", color: "#1E40AF" },
  { name: "농구", color: "#9A3412" },
  { name: "스포츠", color: "#15803D" },
  
  // 분위기
  { name: "힐링", color: "#A855F7" },
  { name: "일상", color: "#06B6D4" },
  { name: "개그", color: "#FDE047" },
  { name: "노맨스", color: "#64748B" },
];

async function main() {
  console.log("Seed 시작...");

  // 기존 태그 삭제 (초기화)
  console.log("기존 태그 삭제 중...");
  await prisma.tag.deleteMany();

  // 기본 태그 생성
  console.log("기본 태그 생성 중...");
  for (const tag of DEFAULT_TAGS) {
    await prisma.tag.create({
      data: {
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
