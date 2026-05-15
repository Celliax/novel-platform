# 소설 플랫폼 (Novel Platform)

![Novel Platform Banner](./public/header.png)

모던하고 세련된 사용자 경험을 제공하는 차세대 웹 소설 플랫폼입니다. 작가와 독자가 더 가깝게 소통하고, 몰입감 넘치는 독서 환경을 제공하는 것을 목표로 합니다.

## 주요 기능

-   **소설 탐색 및 감상**: 홈 화면에서 인기 소설 및 신작 소설 리스트를 확인하고, 장르별/태그별로 소설을 탐색할 수 있습니다.
-   **에피소드 관리**: 회차별로 구성된 소설을 읽고, 다음/이전 화로의 부드러운 이동을 지원합니다.
-   **커뮤니티 & 소통**: 각 에피소드 하단에 댓글을 달아 작가 및 다른 독자들과 소통할 수 있습니다.
-   **선호작 및 평점**: 마음에 드는 소설을 선호작으로 등록하고 평점을 남겨 작가를 응원할 수 있습니다.
-   **공지사항 시스템**: 시스템 공지 및 작가 공지사항을 제공하며, Rich Text Editor(Tiptap)를 통해 이미지와 서식이 포함된 내용을 작성할 수 있습니다.
-   **스마트 공유**: 소설 링크를 SNS나 메신저에 공유할 때 제목과 커버 이미지가 동적으로 포함된 미리보기를 제공합니다.
-   **반응형 UI**: 데스크톱, 태블릿, 모바일 등 모든 기기에서 최적화된 레이아웃을 제공합니다.

## 기술 스택

-   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **Database**: [Prisma](https://www.prisma.io/) (PostgreSQL / SQLite)
-   **Auth**: [Supabase Auth](https://supabase.com/auth) & Discord OAuth
-   **Storage**: [Cloudinary](https://cloudinary.com/) (이미지 및 미디어 업로드)
-   **Editor**: [Tiptap](https://tiptap.dev/) (Headless Rich Text Editor)

## 시작하기

### 1. 프로젝트 클론 및 패키지 설치

```bash
git clone https://github.com/your-repo/novel-platform.git
cd novel-platform
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 입력합니다.

```bash
cp .env.example .env
```

필요한 환경 변수:
- `DATABASE_URL`: 데이터베이스 연결 문자열
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `CLOUDINARY_URL`: Cloudinary API 연결 문자열
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`: Discord OAuth 설정 (선택 사항)

### 3. 데이터베이스 설정

Prisma를 사용하여 데이터베이스 스키마를 적용하고 초기 데이터를 생성합니다.

```bash
npx prisma generate
npx prisma db push
npm run seed # 초기 데이터 시딩
```

### 4. 개발 서버 실행

```bash
npm run dev
```

이제 [http://localhost:3000](http://localhost:3000)에서 플랫폼을 확인할 수 있습니다.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
