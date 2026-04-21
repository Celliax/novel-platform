import Link from "next/link";
import NovelCard from "@/components/NovelCard";
import { listNovelsForHome } from "@/lib/novel-service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const hasDbConfig = Boolean(process.env.DATABASE_URL);
  let novels = [];
  let dbError = false;

  try {
    novels = await listNovelsForHome();
  } catch (error) {
    console.error("Home page data fetch error:", error);
    dbError = true;
  }

  return (
    <div className="hero-gradient">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        {dbError && (
          <div className="mb-8 rounded-xl bg-red-50 text-red-900 px-4 py-4 ring-1 ring-red-200 shadow-sm">
            <h3 className="font-bold text-lg mb-1">데이터베이스 연결 오류</h3>
            <p className="text-sm opacity-90">
              데이터베이스에 연결할 수 없습니다. Render 대시보드에서 DATABASE_URL 설정이 올바른지 확인해 주세요.
            </p>
          </div>
        )}
        <div className="max-w-2xl mb-10">
          <p className="text-sm font-medium text-brand-600 mb-2">웹소설 · 연재 · 독립 출판</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            지금 읽을 만한 인기 작품
          </h1>
          <p className="mt-3 text-muted text-base leading-relaxed">
            데이터는 PostgreSQL에 저장됩니다. 새 작품은「소설 쓰기」에서 등록할 수 있습니다.
          </p>
        </div>
        <h2 className="sr-only">인기 소설</h2>
        {!hasDbConfig && (
          <div className="mb-6 rounded-xl bg-amber-50 text-amber-900 px-4 py-3 ring-1 ring-amber-200 text-sm">
            <p className="font-medium">DB 연결 설정이 필요합니다.</p>
            <p className="mt-1 text-amber-800/90">
              <code className="px-1.5 py-0.5 rounded bg-amber-100">DATABASE_URL</code>을{" "}
              <code className="px-1.5 py-0.5 rounded bg-amber-100">.env</code>에 추가한 뒤{" "}
              <code className="px-1.5 py-0.5 rounded bg-amber-100">npm run db:migrate</code>와{" "}
              <code className="px-1.5 py-0.5 rounded bg-amber-100">npm run db:seed</code>를 실행하세요.
            </p>
          </div>
        )}
        {novels.length === 0 ? (
          <p className="text-muted text-center py-16 rounded-2xl bg-surface/80 ring-1 ring-border/60">
            아직 등록된 소설이 없습니다.{" "}
            <Link href="/novel/create" className="text-brand-600 font-medium hover:underline">
              첫 작품 등록하기
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {novels.map((novel) => (
              <NovelCard
                key={novel.id}
                id={novel.id}
                title={novel.title}
                author={novel.author?.name || novel.author?.email || "작자미상"}
                genre={novel.genre}
                ageRating={novel.ageRating}
                coverImage={novel.coverImage}
                views={novel.views}
                rating={novel.rating}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
