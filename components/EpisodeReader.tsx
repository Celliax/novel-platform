"use client";

import { useState } from "react";
import { ThumbsUp, Check, Loader2 } from "lucide-react";

interface EpisodeReaderProps {
  title: string;
  contentHtml: string;
  image?: string;
  authorNote?: string;
  novelId: number;
  episodeId: number;
  isAdultOnly?: boolean;
}

export default function EpisodeReader({ title, contentHtml, image, authorNote, novelId, episodeId, isAdultOnly }: EpisodeReaderProps) {
  const [recommended, setRecommended] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    if (recommended || loading) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/novel/${novelId}/episode/${episodeId}/recommend`, {
        method: "POST"
      });
      if (res.ok) {
        setRecommended(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-10 pb-8 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          {title}
          {isAdultOnly && (
            <span className="shrink-0 px-2 py-1 bg-red-600 text-white text-xs font-black rounded">19</span>
          )}
        </h1>
      </header>
      
      {image && (
        <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <img src={image} alt="메인 삽화" className="w-full h-auto" />
        </div>
      )}
      
      <div
        className="reader-content text-gray-800 text-[18px] sm:text-[19px] leading-[1.9] space-y-8 font-medium tracking-normal"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
      
      {authorNote && (
        <div className="mt-16 p-8 rounded-2xl bg-amber-50/50 border border-amber-200/50 text-amber-900 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-amber-700">
            <span className="font-black text-xs uppercase tracking-widest bg-amber-200/50 px-2 py-0.5 rounded">Author's Note</span>
          </div>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-bold">{authorNote}</p>
        </div>
      )}

      {/* Recommendation Section */}
      <div className="mt-20 py-12 border-t border-gray-100 flex flex-col items-center">
        <p className="text-sm font-bold text-gray-400 mb-6 tracking-tight">이 회차가 마음에 드셨나요? 작가님께 힘이 되어주세요!</p>
        <button
          onClick={handleRecommend}
          disabled={loading || recommended}
          className={`group relative flex flex-col items-center justify-center w-24 h-24 rounded-full transition-all duration-300 shadow-xl active:scale-90
            ${recommended 
              ? 'bg-purple-600 text-white scale-110 shadow-purple-200' 
              : 'bg-white text-gray-400 border-2 border-gray-100 hover:border-purple-400 hover:text-purple-600'
            }
          `}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={32} />
          ) : recommended ? (
            <Check size={36} className="animate-in zoom-in duration-300" />
          ) : (
            <ThumbsUp size={32} className="group-hover:scale-110 transition-transform" />
          )}
          <span className={`absolute -bottom-8 text-[11px] font-black uppercase tracking-widest transition-colors
            ${recommended ? 'text-purple-600' : 'text-gray-300'}
          `}>
            {recommended ? '추천완료' : '추천하기'}
          </span>
        </button>
      </div>
    </article>
  );
}
