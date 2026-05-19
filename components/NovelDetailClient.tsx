"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Eye, Plus, Heart, Share2, ArrowDownUp, AlertCircle, Settings, Image as ImageIcon, Star, ThumbsUp, X, Loader2 } from "lucide-react";
import CommentSection from "./CommentSection";

type Tag = { id: number; name: string };
type Episode = { id: number; chapterNo: number; displayNo?: number; isSideStory: boolean; isAdultOnly: boolean; title: string; views: number; recommends: number; wordCount?: number; createdAt: string };
type Notice = { id: number; title: string; content: string; image?: string; views: number; createdAt: string };
type Novel = {
  id: number;
  title: string;
  authorId: string;
  author: { name: string, nickname?: string };
  genre: string;
  coverImage: string;
  views: number;
  rating: number;
  recommendCount: number;
  synopsis: string;
  ageRating: string;
  tags: Tag[];
  episodes: Episode[];
  notices: Notice[];
  commentCount: number;
  favoriteCount: number;
};

interface Props {
  novel: Novel;
  isAuthor: boolean;
  initialIsFavorited: boolean;
  recommendedNovels: Novel[];
}

export default function NovelDetailClient({ novel, isAuthor, initialIsFavorited, recommendedNovels }: Props) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [activeTab, setActiveTab] = useState<'episodes' | 'notices'>('episodes');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const [showRateModal, setShowRateModal] = useState(false);
  const [displayRating, setDisplayRating] = useState(novel.rating);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  const handleRate = async (score: number) => {
    setRatingLoading(true);
    try {
      const res = await fetch(`/api/novel/${novel.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });
      if (res.ok) {
        const data = await res.json();
        setDisplayRating(data.avgRating);
        alert("별점이 등록되었습니다!");
        setShowRateModal(false);
      } else {
        alert("별점 등록에 실패했습니다. 로그인이 필요할 수 있습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setRatingLoading(false);
    }
  };

  const toggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      const res = await fetch(`/api/novel/${novel.id}/favorite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.isFavorited);
      } else if (res.status === 401) {
        alert("로그인이 필요합니다.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("사이트 링크가 복사되었습니다.");
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      alert("신고 사유를 입력해주세요.");
      return;
    }
    setReporting(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOVEL',
          targetId: novel.id,
          reason: reportReason,
        }),
      });
      if (res.ok) {
        alert("신고되었습니다.");
        setShowReportModal(false);
      } else {
        alert("신고에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setReporting(false);
    }
  };

  const authorName = novel.author?.nickname || novel.author?.name || "작자미상";
  const displayedEpisodes = sortAsc ? novel.episodes : [...novel.episodes].reverse();
  const firstEpisode = novel.episodes[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 bg-surface min-h-screen">
      {/* Top Section: Novel Info */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        <div className="w-full max-w-[280px] shrink-0 mx-auto lg:mx-0">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-border">
            <Image src={novel.coverImage} alt={novel.title} fill className="object-cover" sizes="280px" priority />
            {isAuthor && (
              <Link 
                href={`/novel/${novel.id}/settings`}
                className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[2px]"
              >
                <div className="w-12 h-12 rounded-full bg-surface/20 flex items-center justify-center mb-2">
                  <ImageIcon size={24} className="text-white" />
                </div>
                <span className="text-white text-xs font-bold">표지/정보 변경</span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-start">
          <div className="flex lg:hidden w-full justify-end gap-3 mb-4">
             <button onClick={() => setShowRateModal(true)} className="flex items-center justify-center w-10 h-10 rounded-full border border-border">
               <Star size={18} className="text-amber-400 fill-amber-400" />
             </button>
             <button onClick={toggleFavorite} className={`flex items-center justify-center w-10 h-10 rounded-full border ${isFavorited ? 'border-red-500 bg-red-50' : 'border-border'}`}>
               <Heart size={18} className={isFavorited ? 'fill-red-500 text-red-500' : 'text-foreground/80'} />
             </button>
             <button onClick={handleShare} className="flex items-center justify-center w-10 h-10 rounded-full border border-border">
               <Share2 size={18} className="text-foreground/80" />
             </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground">{novel.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
            <Link href={`/profile/${novel.authorId}`} className="font-bold text-foreground/90 mr-1 hover:text-brand-600 hover:underline transition-colors">{authorName}</Link>
            {novel.ageRating === "15세 이용가" && <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded font-bold">15</span>}
            {novel.ageRating === "19세 이용가" && <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded font-bold">19</span>}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted font-medium mb-4">
            <span className="flex items-center gap-1.5 font-bold text-foreground/90">
              <Star size={16} className="text-amber-400 fill-amber-400" /> 
              별점 <span className="font-normal text-muted">{displayRating.toFixed(1)}</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-foreground/90">
              <ThumbsUp size={16} className="text-brand-600" />
              추천 <span className="font-normal text-muted">{novel.recommendCount.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-foreground/90">
              조회 <span className="font-normal text-muted">{novel.views.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-foreground/90">
              댓글 <span className="font-normal text-muted">{novel.commentCount.toLocaleString()}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {novel.tags && novel.tags.map(t => <span key={t.id} className="px-2.5 py-1 bg-gray-100/80 text-muted text-xs font-bold rounded">#{t.name}</span>)}
          </div>

          <div className="w-full bg-canvas rounded-xl p-5 mb-6 border border-border/50">
            <div className="flex flex-wrap items-center gap-6 mb-4 text-sm font-bold text-foreground/90">
              <span className="flex items-center gap-1.5"><Heart size={16} className="text-muted/80"/> 선호</span>
              <span className="flex items-center gap-1.5"><BookOpen size={16} className="text-muted/80"/> 회차 <span className="font-medium text-muted">{novel.episodes.length}회차</span></span>
            </div>
            <div className="text-sm text-muted leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: novel.synopsis }} />
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="flex gap-3">
              <Link href={firstEpisode ? `/novel/${novel.id}/episode/${firstEpisode.id}` : '#'} className="flex-1 lg:flex-none px-12 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded text-center transition-colors shadow-card">
                {firstEpisode ? (firstEpisode.isSideStory ? '첫 외전보기' : `EP.${firstEpisode.displayNo}. 이어보기`) : '첫화보기'}
              </Link>
            </div>
            {isAuthor && (
              <div className="w-full lg:w-auto flex flex-col gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs font-extrabold text-amber-700">✦ 작가 전용</span>
                  <span className="text-xs text-amber-600">회차와 공지를 등록하고 작품을 관리하세요.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/novel/${novel.id}/episode/create`} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white font-extrabold rounded transition-colors shadow-card text-sm"><Plus size={16} />회차 등록</Link>
                  <Link href={`/novel/${novel.id}/notice/create`} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border hover:bg-canvas text-foreground font-extrabold rounded transition-colors shadow-card text-sm"><AlertCircle size={16} className="text-brand-600" />작가 공지</Link>
                  <Link href={`/novel/${novel.id}/settings`} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border hover:bg-canvas text-foreground font-extrabold rounded transition-colors shadow-card text-sm"><Settings size={16} className="text-muted" />작품 설정</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex flex-col gap-6 items-center lg:ml-auto shrink-0 pr-4">
          <div className="flex gap-5 text-center">
            <button onClick={() => setShowRateModal(true)} className="flex flex-col items-center gap-2 group">
              <div className="w-[52px] h-[52px] rounded-full border border-border flex items-center justify-center group-hover:bg-amber-50 transition shadow-card">
                <Star size={22} className="text-amber-400 fill-amber-400" />
              </div>
              <span className="text-xs font-bold text-muted">별점</span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
              <div className="w-[52px] h-[52px] rounded-full border border-border flex items-center justify-center group-hover:bg-canvas transition shadow-card">
                <Share2 size={22} className="text-muted" />
              </div>
              <span className="text-xs font-bold text-muted">공유</span>
            </button>
            <button onClick={toggleFavorite} disabled={favoriteLoading} className="flex flex-col items-center gap-2 group">
              <div className={`w-[52px] h-[52px] rounded-full border flex items-center justify-center transition shadow-card ${isFavorited ? 'border-red-500 bg-red-50' : 'border-border group-hover:bg-canvas'}`}><Heart size={22} className={isFavorited ? 'fill-red-500 text-red-500' : 'text-muted'} /></div>
              <span className="text-xs font-bold text-muted">{(novel.views / 20).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
        <div>
          <div className="flex gap-8 border-b border-border mb-6">
            <button onClick={() => setActiveTab('episodes')} className={`pb-3 text-[17px] font-extrabold transition-all relative ${activeTab === 'episodes' ? 'text-foreground' : 'text-muted/80 hover:text-muted'}`}>회차정보{activeTab === 'episodes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}</button>
            <button onClick={() => setActiveTab('notices')} className={`pb-3 text-[17px] font-extrabold transition-all relative ${activeTab === 'notices' ? 'text-foreground' : 'text-muted/80 hover:text-muted'}`}>작가공지<span className="ml-1.5 text-xs text-brand-600 font-bold bg-brand-50 px-1.5 py-0.5 rounded-full">{novel.notices.length}</span>{activeTab === 'notices' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}</button>
          </div>

          {activeTab === 'episodes' ? (
            <>
              <div className="flex justify-between items-end border-b-2 border-gray-900 pb-3 mb-2">
                <h2 className="text-[19px] font-extrabold text-foreground">회차리스트</h2>
                <button onClick={() => setSortAsc(!sortAsc)} className="text-xs font-bold text-muted flex items-center gap-1 hover:text-foreground/90 transition-colors">{sortAsc ? '첫화부터' : '최신화부터'} <ArrowDownUp size={12}/></button>
              </div>
              <ul className="divide-y divide-gray-100">
                {displayedEpisodes.map(ep => (
                  <li key={ep.id} className="group py-4 flex items-start gap-3 hover:bg-canvas transition-colors px-2 rounded-lg">
                    <Link href={`/novel/${novel.id}/episode/${ep.id}`} className="flex-1">
                      <div className="font-bold text-[15px] text-foreground/90 group-hover:text-brand-700 transition-colors flex items-center gap-1.5 flex-wrap">
                        {ep.isSideStory && <span className="text-brand-600">[외전]</span>}
                        <span>{ep.title}</span>
                        {ep.isAdultOnly && (
                          <span className="shrink-0 px-1 py-0.5 bg-red-600 text-white text-[9px] font-black rounded leading-none">19</span>
                        )}
                      </div>
                      <div className="flex gap-3 text-[11px] text-muted/80 font-medium mt-1.5">
                        <span>{ep.isSideStory ? '외전' : `EP.${ep.displayNo}`}</span>
                        <span className="flex items-center gap-1"><Eye size={12}/> {ep.views?.toLocaleString() || 0}</span>
                        {ep.wordCount !== undefined && <span className="flex items-center gap-1">{ep.wordCount.toLocaleString()}자</span>}
                      </div>
                    </Link>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-[11px] text-muted/80 font-medium mt-1">{new Date(ep.createdAt).toLocaleDateString('ko-KR')}</div>
                      {isAuthor && <Link href={`/novel/${novel.id}/episode/${ep.id}/edit`} className="text-[11px] text-brand-600 font-bold hover:underline">수정하기</Link>}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="space-y-4">
               {novel.notices.length > 0 ? (
                 novel.notices.map(notice => (
                   <Link key={notice.id} href={`/novel/${novel.id}/notice/${notice.id}`} className="block p-5 rounded-2xl border border-border bg-canvas/30 hover:border-brand-200 hover:bg-brand-50/20 transition-all group">
                     <div className="flex justify-between items-start mb-2"><h3 className="font-extrabold text-foreground group-hover:text-brand-700 transition-colors">{notice.title}</h3><span className="text-[11px] text-muted/80 font-bold">{new Date(notice.createdAt).toLocaleDateString()}</span></div>
                     <div className="text-xs text-muted line-clamp-1 mb-3">{notice.content}</div>
                     <div className="flex items-center gap-3 text-[10px] text-muted/80 font-bold"><span className="flex items-center gap-1"><Eye size={12}/> {notice.views.toLocaleString()}</span></div>
                   </Link>
                 ))
               ) : <div className="py-20 text-center text-muted/80 font-medium border-2 border-dashed border-border rounded-3xl">등록된 공지사항이 없습니다.</div>}
            </div>
          )}
          <CommentSection novelId={novel.id} title="소설 전체 댓글" showInput={false} authorId={novel.authorId} />
        </div>

        <div className="space-y-10">
          <div>
            <h2 className="text-[17px] font-extrabold text-foreground mb-4">추천 작품</h2>
            <div className="border border-border p-4 rounded-xl shadow-card space-y-5">
              {recommendedNovels.map(rec => (
                <Link key={rec.id} href={`/novel/${rec.id}`} className="flex gap-3 group cursor-pointer">
                  <div className="w-16 h-20 bg-gray-200 rounded-md overflow-hidden shrink-0 relative"><Image src={rec.coverImage || "/placeholder-cover.svg"} alt={rec.title} fill className="object-cover group-hover:scale-105 transition-transform" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-foreground leading-tight mb-2 truncate group-hover:text-brand-700 transition-colors">{rec.title}</div>
                    <div className="flex gap-1.5 mb-2">{rec.ageRating === "19세 이용가" ? <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] rounded font-bold">19</span> : rec.ageRating === "15세 이용가" ? <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] rounded font-bold">15</span> : <span className="px-1.5 py-0.5 bg-green-600 text-white text-[9px] rounded font-bold">All</span>}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 mb-4"><AlertCircle size={24} /><h3 className="text-lg font-bold">신고하기</h3></div>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 min-h-[100px] resize-none mb-6" placeholder="신고 사유를 입력하세요..." />
            <div className="flex gap-3"><button onClick={() => setShowReportModal(false)} className="flex-1 py-3 border border-border rounded-xl text-sm font-bold text-muted hover:bg-canvas transition-colors">취소</button><button onClick={handleReport} disabled={reporting} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">{reporting ? "처리 중..." : "확인"}</button></div>
          </div>
        </div>
      )}
      {/* Rating Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-400 mb-6 border border-amber-100">
                <Star size={32} className="fill-amber-400" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">작품을 평가해 주세요</h3>
              <p className="text-sm text-muted/80 font-bold mb-8">독자님의 평가는 작가님께 큰 힘이 됩니다!</p>
              
              <div className="flex gap-2 mb-10">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onMouseEnter={() => setHoverRating(num)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(num)}
                    disabled={ratingLoading}
                    className="group relative transition-transform active:scale-90"
                  >
                    <Star
                      size={40}
                      className={`transition-colors duration-200 ${
                        (hoverRating || 0) >= num || (!hoverRating && false)
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200 fill-gray-100"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowRateModal(false)}
                className="w-full py-4 bg-canvas hover:bg-gray-100 text-muted font-black rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                나중에 하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-foreground">작품 신고하기</h3>
                <button onClick={() => setShowReportModal(false)} className="text-muted/80 hover:text-muted"><X size={24} /></button>
              </div>
              <p className="text-sm text-muted font-bold mb-4 leading-relaxed italic border-l-4 border-red-500 pl-3 bg-red-50 py-3 rounded-r-lg">부적절한 내용이나 저작권 침해 등의 사유가 있을 경우 신고해 주세요. 운영진이 검토 후 조치하겠습니다.</p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="신고 사유를 구체적으로 작성해 주세요..."
                className="w-full h-32 p-4 bg-canvas border-none rounded-2xl focus:ring-2 focus:ring-red-500 font-medium text-sm mb-6"
              />
              <button
                onClick={handleReport}
                disabled={reporting}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reporting ? <Loader2 className="animate-spin" size={18} /> : "신고 접수하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
