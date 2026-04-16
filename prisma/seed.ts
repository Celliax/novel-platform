import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL이 필요합니다. seed 실행 전 .env를 설정하세요.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg(url) });

async function main() {
  await prisma.episode.deleteMany();
  await prisma.novel.deleteMany();
  await prisma.user.deleteMany();

  // 테스트 사용자 생성
  const user1 = await prisma.user.create({
    data: {
      id: "test-user-1",
      email: "author1@example.com",
      name: "임정희",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: "test-user-2",
      email: "author2@example.com",
      name: "김민수",
    },
  });

  await prisma.novel.create({
    data: {
      title: "회생한 마왕의 일상",
      authorId: user1.id,
      genre: "판타지",
      coverImage: "/placeholder-cover.svg",
      views: 125_000,
      rating: 4.8,
      synopsis:
        "<p>한때 세계를 뒤흔든 마왕이 조용한 마을에서 빵 굽는 삶을 선택했다. 그런데 과거 부하들이 하나둘 찾아오기 시작한다.</p>",
      episodes: {
        create: [
          {
            chapterNo: 1,
            title: "프롤로그 — 오븐 앞의 마왕",
            content:
              "<p>새벽 빵 냄새가 마을 골목을 감쌌다. 루시안은 밀가루 묻은 손으로 오븐 문을 열었다.</p><p><strong>「오늘은 호밀빵이다.」</strong></p><p>그의 목소리는 더 이상 군대를 움직이지 않았지만, 여전히 사람의 마음을 움직일 줄 알았다.</p>",
          },
          {
            chapterNo: 2,
            title: "1화 — 찾아온 검은 망토",
            content:
              "<p>가게 종이 울리기도 전에 문이 열렸다. 검은 망토를 둘른 방문객은 깊이 숙였다.</p><blockquote>폐하, 북부가… 다시 움직입니다.</blockquote><p>루시안은 잠시 침묵했다가, 부드럽게 웃었다.</p>",
          },
        ],
      },
    },
  });

  await prisma.novel.create({
    data: {
      title: "아카데미의 최강 요리사",
      authorId: user2.id,
      genre: "일상",
      coverImage: "/placeholder-cover.svg",
      views: 89_000,
      rating: 4.5,
      synopsis:
        "<p>마법 학교 최하위생이었던 주인공이 ‘요리’라는 비전투 스킬로 캠퍼스를 뒤집어 놓는 이야기.</p>",
      episodes: {
        create: [
          {
            chapterNo: 1,
            title: "1화 — 급식실의 반란",
            content:
              "<p>급식실은 언제나 전쟁터였다. 하지만 오늘은 달랐다.</p><p>한 그릇의 수프가 조용히 줄을 서게 만들었다.</p>",
          },
        ],
      },
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: "test-user-3",
      email: "author3@example.com",
      name: "박지훈",
    },
  });

  await prisma.novel.create({
    data: {
      title: "나만 아는 던전",
      authorId: user3.id,
      genre: "액션",
      coverImage: "/placeholder-cover.svg",
      views: 203_000,
      rating: 4.9,
      synopsis:
        "<p>던전 지도에 없는 층, 나만 통과할 수 있는 문. 그 너머에서 깨닫는 것은 보물이 아니라 진실이었다.</p>",
      episodes: {
        create: [
          {
            chapterNo: 1,
            title: "1화 — 지도에 없는 계단",
            content:
              "<p>벽에 스친 손끝이 걸렸다. 차가운 돌이 아니라, 누군가 일부러 숨긴 손잡이였다.</p>",
          },
          {
            chapterNo: 2,
            title: "2화 — 빈 방의 중심",
            content:
              "<p>방은 비어 있었다. 그런데 발밑의 원은 분명히 말하고 있었다.</p><p><em>누군가가 여기까지 왔다고.</em></p>",
          },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
