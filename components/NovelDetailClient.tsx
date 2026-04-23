"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Eye, Plus, Heart, Share2, ArrowDownUp, AlertCircle, Settings, Image as ImageIcon } from "lucide-react";
import CommentSection from "./CommentSection";

type Tag = { id: number; name: string };
type Episode = { id: number; chapterNo: number; isSideStory: boolean; title: string; views: number; recommends: number; createdAt: string };
type Notice = { id: number; title: string; content: string; views: number; createdAt: string };
type Novel = {
  id: number;
  title: string;
  authorId: string;
  author: { name: string, nickname?: string };
  genre: string;
  coverImage: string;
  views: number;
  rating: number;
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
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 bg-white min-h-screen">
      {/* Top Section: Novel Info */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        <div className="w-full max-w-[280px] shrink-0 mx-auto lg:mx-0">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-gray-100">
            <Image src={novel.coverImage} alt={novel.title} fill className="object-cover" sizes="280px" priority />
            {isAuthor && (
              <Link 
                href={`/novel/${novel.id}/settings`}
                className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[2px]"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <ImageIcon size={24} className="text-white" />
                </div>
                <span className="text-white text-xs font-bold">표지/정보 변경</span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 w-full flex flex-col items-start">
          <div className="flex lg:hidden w-full justify-end gap-3 mb-4">
             <button onClick={toggleFavorite} className={`flex items-center justify-center w-10 h-10 rounded-full border ${isFavorited ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
               <Heart size={18} className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-700'} />
             </button>
             <button onClick={handleShare} className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200">
               <Share2 size={18} className="text-gray-700" />
             </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">{novel.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
            <Link href={`/profile/${novel.authorId}`} className="font-bold text-gray-800 mr-1 hover:text-purple-600 hover:underline transition-colors">{authorName}</Link>
            {novel.ageRating === "15세 이용가" && <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded font-bold">15</span>}
            {novel.ageRating === "19세 이용가" && <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded font-bold">19</span>}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 font-medium mb-4">
            <span className="flex items-center gap-1.5 font-bold text-gray-800">조회 <span className="font-normal text-gray-600">{novel.views.toLocaleString()}</span></span>
            <span className="flex items-center gap-1.5 font-bold text-gray-800">추천 <span className="font-normal text-gray-600">{novel.rating.toLocaleString()}</span></span>
            <span className="flex items-center gap-1.5 font-bold text-gray-800">댓글 <span className="font-normal text-gray-600">{novel.commentCount.toLocaleString()}</span></span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {novel.tags && novel.tags.map(t => <span key={t.id} className="px-2.5 py-1 bg-gray-100/80 text-gray-500 text-xs font-bold rounded">#{t.name}</span>)}
          </div>

          <div className="w-full bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100/50">
            <div className="flex flex-wrap items-center gap-6 mb-4 text-sm font-bold text-gray-800">
              <span className="flex items-center gap-1.5"><Heart size={16} className="text-gray-400"/> 선호</span>
              <span className="flex items-center gap-1.5"><BookOpen size={16} className="text-gray-400"/> 회차 <span className="font-medium text-gray-600">{novel.episodes.length}회차</span></span>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: novel.synopsis }} />
          </div>

          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <div className="flex gap-3">
              <Link href={firstEpisode ? `/novel/${novel.id}/episode/${firstEpisode.id}` : '#'} className="flex-1 lg:flex-none px-12 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-center transition-colors shadow-sm">
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
                  <Link href={`/novel/${novel.id}/episode/create`} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white font-extrabold rounded transition-colors shadow-sm text-sm"><Plus size={16} />회차 등록</Link>
                  <Link href={`/novel/${novel.id}/notice/create`} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-extrabold rounded transition-colors shadow-sm text-sm"><AlertCircle size={16} className="text-purple-600" />작가 공지</Link>
                  <Link href={`/novel/${novel.id}/settings`} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-extrabold rounded transition-colors shadow-sm text-sm"><Settings size={16} className="text-gray-500" />작품 설정</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex flex-col gap-6 items-center lg:ml-auto shrink-0 pr-4">
          <div className="flex gap-5 text-center">
            <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
              <div className="w-[52px] h-[52px] rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-gray-50 transition shadow-sm"><Share2 size={22} className="text-gray-600" /></div>
              <span className="text-xs font-bold text-gray-500">공유</span>
            </button>
            <button onClick={toggleFavorite} disabled={favoriteLoading} className="flex flex-col items-center gap-2 group">
              <div className={`w-[52px] h-[52px] rounded-full border flex items-center justify-center transition shadow-sm ${isFavorited ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:bg-gray-50'}`}><Heart size={22} className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'} /></div>
              <span className="text-xs font-bold text-gray-500">{(novel.views / 20).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
        <div>
          <div className="flex gap-8 border-b border-gray-100 mb-6">
            <button onClick={() => setActiveTab('episodes')} className={`pb-3 text-[17px] font-extrabold transition-all relative ${activeTab === 'episodes' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>회차정보{activeTab === 'episodes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}</button>
            <button onClick={() => setActiveTab('notices')} className={`pb-3 text-[17px] font-extrabold transition-all relative ${activeTab === 'notices' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>작가공지<span className="ml-1.5 text-xs text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded-full">{novel.notices.length}</span>{activeTab === 'notices' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}</button>
          </div>

          {activeTab === 'episodes' ? (
            <>
              <div className="flex justify-between items-end border-b-2 border-gray-900 pb-3 mb-2">
                <h2 className="text-[19px] font-extrabold text-gray-900">회차리스트</h2>
                <button onClick={() => setSortAsc(!sortAsc)} className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:text-gray-800 transition-colors">{sortAsc ? '첫화부터' : '최신화부터'} <ArrowDownUp size={12}/></button>
              </div>
              <ul className="divide-y divide-gray-100">
                {displayedEpisodes.map(ep => (
                  <li key={ep.id} className="group py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors px-2 rounded-lg">
                    <Link href={`/novel/${novel.id}/episode/${ep.id}`} className="flex-1">
                      <div className="font-bold text-[15px] text-gray-800 group-hover:text-purple-700 transition-colors">
                        {ep.isSideStory && <span className="text-purple-600 mr-1.5">[외전]</span>}
                        {ep.title}
                      </div>
                      <div className="flex gap-3 text-[11px] text-gray-400 font-medium mt-1.5">
                        <span>{ep.isSideStory ? '외전' : `EP.${ep.displayNo}`}</span>
                        <span className="flex items-center gap-1"><Eye size={12}/> {ep.views?.toLocaleString() || 0}</span>
                      </div>
                    </Link>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-[11px] text-gray-400 font-medium mt-1">{new Date(ep.createdAt).toLocaleDateString('ko-KR')}</div>
                      {isAuthor && <Link href={`/novel/${novel.id}/episode/${ep.id}/edit`} className="text-[11px] text-purple-600 font-bold hover:underline">수정하기</Link>}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="space-y-4">
               {novel.notices.length > 0 ? (
                 novel.notices.map(notice => (
                   <Link key={notice.id} href={`/novel/${novel.id}/notice/${notice.id}`} className="block p-5 rounded-2xl border border-gray-100 bg-gray-50/30 hover:border-purple-200 hover:bg-purple-50/20 transition-all group">
                     <div className="flex justify-between items-start mb-2"><h3 className="font-extrabold text-gray-900 group-hover:text-purple-700 transition-colors">{notice.title}</h3><span className="text-[11px] text-gray-400 font-bold">{new Date(notice.createdAt).toLocaleDateString()}</span></div>
                     <div className="text-xs text-gray-500 line-clamp-1 mb-3">{notice.content}</div>
                     <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold"><span className="flex items-center gap-1"><Eye size={12}/> {notice.views.toLocaleString()}</span></div>
                   </Link>
                 ))
               ) : <div className="py-20 text-center text-gray-400 font-medium border-2 border-dashed border-gray-100 rounded-3xl">등록된 공지사항이 없습니다.</div>}
            </div>
          )}
          <CommentSection novelId={novel.id} title="소설 전체 댓글" showInput={false} authorId={novel.authorId} />
        </div>

        <div className="space-y-10">
          <div>
            <h2 className="text-[17px] font-extrabold text-gray-900 mb-4">추천 작품</h2>
            <div className="border border-gray-200 p-4 rounded-xl shadow-sm space-y-5">
              {recommendedNovels.map(rec => (
                <Link key={rec.id} href={`/novel/${rec.id}`} className="flex gap-3 group cursor-pointer">
                  <div className="w-16 h-20 bg-gray-200 rounded-md overflow-hidden shrink-0 relative"><Image src={rec.coverImage || "/placeholder-cover.svg"} alt={rec.title} fill className="object-cover group-hover:scale-105 transition-transform" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-gray-900 leading-tight mb-2 truncate group-hover:text-purple-700 transition-colors">{rec.title}</div>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 mb-4"><AlertCircle size={24} /><h3 className="text-lg font-bold">신고하기</h3></div>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 min-h-[100px] resize-none mb-6" placeholder="신고 사유를 입력하세요..." />
            <div className="flex gap-3"><button onClick={() => setShowReportModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors">취소</button><button onClick={handleReport} disabled={reporting} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">{reporting ? "처리 중..." : "확인"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
