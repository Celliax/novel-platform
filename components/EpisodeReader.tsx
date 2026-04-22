"use client";

import { useEffect, useRef } from "react";

interface EpisodeReaderProps {
  title: string;
  contentHtml: string;
  image?: string;
  authorNote?: string;
  novelId: number;
  episodeId: number;
}

export default function EpisodeReader({ title, contentHtml, image, authorNote, novelId, episodeId }: EpisodeReaderProps) {
  // 조회수 증가는 이제 서버 컴포넌트에서 직접 처리하므로 클라이언트 측 코드는 제거합니다.
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-10 pb-8 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{title}</h1>
      </header>
      {image && (
        <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-border">
          <img src={image} alt="메인 삽화" className="w-full h-auto" />
        </div>
      )}
      <div
        className="reader-content text-foreground/95 text-lg leading-[1.85] space-y-6"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      {authorNote && (
        <div className="mt-12 p-6 rounded-2xl bg-amber-50/50 border border-amber-200/50 text-amber-900">
          <div className="flex items-center gap-2 mb-3 text-amber-700">
            <span className="font-extrabold text-sm tracking-tight">작가의 말</span>
          </div>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{authorNote}</p>
        </div>
      )}
    </article>
  );
}
