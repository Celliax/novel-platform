"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronRight, Eye, Star, Plus, Heart, Share2, MessageSquare, ArrowDownUp, AlertCircle, Loader2 } from "lucide-react";
import CommentSection from "@/components/CommentSection";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

type Tag = {
  id: number;
  name: string;
};

type Episode = {
  id: number;
  chapterNo: number;
  title: string;
  views: number;
  recommends: number;
  createdAt: string;
};

type Comment = {
  id: number;
  novelId: number;
  userId: string;
  userName: string;
  content: string;
  recommends: number;
  dislikes: number;
  createdAt: string;
};

type Notice = {
  id: number;
  title: string;
  views: number;
  createdAt: string;
};

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

export default function NovelDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [recommendedNovels, setRecommendedNovels] = useState<Novel[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isAuthor, setIsAuthor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [activeTab, setActiveTab] = useState<'episodes' | 'notices'>('episodes');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'COMMENT' | 'NOVEL', id: number } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    loadNovel();
    loadRecommendedNovels();
    loadComments();
  }, [id]);

  const loadNovel = async () => {
    try {
      const response = await fetch(`/api/novel/${id}`, { cache: 'no-store' });
      if (response.ok) {
        const novelData = await response.json();
        setNovel(novelData.novel);

        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthor(user?.id === novelData.novel.authorId);

        if (user) {
          // 성인 인증 체크
          const userRes = await fetch(`/api/user/${user.id}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            if (novelData.novel.ageRating === "19세 이용가") {
              if (userData.user.age !== undefined && userData.user.age !== null && userData.user.age < 19) {
                alert("이 작품은 19세 이상만 이용 가능합니다.");
                window.location.href = "/";
                return;
              }
              if (!userData.user.age) {
                if (confirm("이 작품은 성인 인증이 필요합니다. 프로필 설정 페이지로 이동하시겠습니까?")) {
                  window.location.href = "/profile/setup";
                } else {
                  window.location.href = "/";
                }
                return;
              }
            }
          }

          const favRes = await fetch(`/api/novel/${id}/favorite`);
          if (favRes.ok) {
            const favData = await favRes.json();
            setIsFavorited(favData.isFavorited);
          }
        } else if (novelData.novel.ageRating === "19세 이용가") {
          alert("성인 인증이 필요한 작품입니다. 로그인이 필요합니다.");
          window.location.href = "/login";
          return;
        }
      } else {
        notFound();
      }
    } catch (error) {
      console.error("작품 로드 실패:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedNovels = async () => {
    try {
      const res = await fetch('/api/novel/list'); 
      if (res.ok) {
        const data = await res.json();
        setRecommendedNovels(data.novels.filter((n: Novel) => n.id !== id).slice(0, 3));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/novel/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      const res = await fetch(`/api/novel/${id}/favorite`, { method: "POST" });
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

  const handleCommentAction = async (commentId: number, action: 'recommend' | 'dislike') => {
    try {
      const res = await fetch(`/api/comment/${commentId}/${action}`, { method: 'POST' });
      if (res.ok) {
        loadComments();
      } else if (res.status === 401) {
        alert("로그인이 필요합니다.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openReportModal = (type: 'COMMENT' | 'NOVEL', targetId: number) => {
    setReportTarget({ type, id: targetId });
    setReportReason("");
    setShowReportModal(true);
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
          type: reportTarget?.type,
          targetId: reportTarget?.id,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-muted text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!novel) {
    notFound();
  }

  const authorName = novel.author?.nickname || novel.author?.name || "작자미상";
  const displayedEpisodes = sortAsc ? novel.episodes : [...novel.episodes].reverse();
  const firstEpisode = novel.episodes[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 bg-white min-h-screen">
      
      {/* Top Section: Novel Info */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        {/* Cover Image */}
        <div className="w-full max-w-[280px] shrink-0 mx-auto lg:mx-0">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-gray-100">
            <Image
              src={novel.coverImage}
              alt={novel.title}
              fill
              className="object-cover"
              sizes="280px"
              priority
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="flex-1 w-full flex flex-col items-start">
          
          {/* Top Actions for mobile */}
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
            <span className="font-bold text-gray-800 mr-1">{authorName}</span>
            {novel.ageRating === "15세 이용가" && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded font-bold">15</span>
            )}
            {novel.ageRating === "19세 이용가" && (
              <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded font-bold">19</span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 font-medium mb-4">
            <span className="flex items-center gap-1.5 font-bold text-gray-800">조회 <span className="font-normal text-gray-600">{novel.views.toLocaleString()}</span></span>
            <span className="flex items-center gap-1.5 font-bold text-gray-800">추천 <span className="font-normal text-gray-600">{novel.rating.toLocaleString()}</span></span>
            <span className="flex items-center gap-1.5 font-bold text-gray-800">댓글 <span className="font-normal text-gray-600">{novel.commentCount.toLocaleString()}</span></span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {novel.tags && novel.tags.map(t => (
              <span key={t.id} className="px-2.5 py-1 bg-gray-100/80 text-gray-500 text-xs font-bold rounded">#{t.name}</span>
            ))}
            <button className="px-2.5 py-1 bg-blue-50/50 text-blue-500 text-xs font-bold rounded border border-blue-100">+나만의 태그 추가</button>
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
              <Link 
                href={firstEpisode ? `/novel/${novel.id}/episode/${firstEpisode.id}` : '#'}
                className="flex-1 lg:flex-none px-12 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-center transition-colors shadow-sm"
              >
                {firstEpisode ? `EP.${firstEpisode.chapterNo}. 이어보기` : '첫화보기'}
              </Link>
            </div>
            {isAuthor && (
              <div className="w-full lg:w-auto flex flex-col gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs font-extrabold text-amber-700">✦ 작가 전용</span>
                  <span className="text-xs text-amber-600">회차와 공지를 등록하고 작품을 관리하세요.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/novel/${novel.id}/episode/create`}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-black text-white font-extrabold rounded transition-colors shadow-sm text-sm"
                  >
                    <Plus size={16} />
                    회차 등록
                  </Link>
                  <Link
                    href={`/novel/${novel.id}/notice/create`}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-extrabold rounded transition-colors shadow-sm text-sm"
                  >
                    <AlertCircle size={16} className="text-purple-600" />
                    작가 공지
                  </Link>
                  <Link
                    href={`/novel/${novel.id}/settings`}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 font-extrabold rounded transition-colors shadow-sm text-sm"
                  >
                    <Settings size={16} className="text-gray-500" />
                    작품 설정
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Right Action Icons (Desktop) */}
        <div className="hidden lg:flex flex-col gap-6 items-center lg:ml-auto shrink-0 pr-4">
          <div className="flex gap-5 text-center">
            <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
              <div className="w-[52px] h-[52px] rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-gray-50 transition shadow-sm">
                <Share2 size={22} className="text-gray-600" />
              </div>
              <span className="text-xs font-bold text-gray-500">공유</span>
            </button>
            <button onClick={toggleFavorite} disabled={favoriteLoading} className="flex flex-col items-center gap-2 group">
              <div className={`w-[52px] h-[52px] rounded-full border flex items-center justify-center transition shadow-sm ${isFavorited ? 'border-red-500 bg-red-50' : 'border-gray-200 group-hover:bg-gray-50'}`}>
                <Heart size={22} className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
              </div>
              <span className="text-xs font-bold text-gray-500">{(novel.views / 20).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Episodes & Sidebar */}
      <div className="mt-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
        
        {/* Left: Episodes & Comments */}
        <div>
          {/* Tabs */}
          <div className="flex gap-8 border-b border-gray-100 mb-6">
            <button 
              onClick={() => setActiveTab('episodes')}
              className={`pb-3 text-[17px] font-extrabold transition-all relative ${activeTab === 'episodes' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              회차정보
              {activeTab === 'episodes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
            </button>
            <button 
              onClick={() => setActiveTab('notices')}
              className={`pb-3 text-[17px] font-extrabold transition-all relative ${activeTab === 'notices' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              작가공지
              <span className="ml-1.5 text-xs text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded-full">{novel.notices.length}</span>
              {activeTab === 'notices' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />}
            </button>
          </div>

          {activeTab === 'episodes' ? (
            <>
              {/* Episode List Header */}
              <div className="flex justify-between items-end border-b-2 border-gray-900 pb-3 mb-2">
                <h2 className="text-[19px] font-extrabold text-gray-900">회차리스트</h2>
                <button 
                  onClick={() => setSortAsc(!sortAsc)} 
                  className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:text-gray-800 transition-colors"
                >
                  {sortAsc ? '첫화부터' : '최신화부터'} <ArrowDownUp size={12}/>
                </button>
              </div>
              
              {/* Episode List */}
              <ul className="divide-y divide-gray-100">
                {displayedEpisodes.length > 0 ? (
                  displayedEpisodes.map(ep => (
                    <li key={ep.id} className="group py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors px-2 rounded-lg">
                      <Link href={`/novel/${novel.id}/episode/${ep.id}`} className="flex-1">
                        <div className="font-bold text-[15px] text-gray-800 group-hover:text-purple-700 transition-colors">{ep.title}</div>
                        <div className="flex gap-3 text-[11px] text-gray-400 font-medium mt-1.5">
                          <span>EP.{ep.chapterNo}</span>
                          <span className="flex items-center gap-1"><Eye size={12}/> {ep.views?.toLocaleString() || 0}</span>
                          <span className="flex items-center gap-1"><Heart size={12}/> {ep.recommends?.toLocaleString() || 0}</span>
                        </div>
                      </Link>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-[11px] text-gray-400 font-medium mt-1">
                          {ep.createdAt ? new Date(ep.createdAt).toLocaleDateString('ko-KR', { 
                            year: '2-digit', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }) : new Date().toLocaleDateString('ko-KR', { 
                            year: '2-digit', 
                            month: '2-digit', 
                            day: '2-digit' 
                          })}
                        </div>
                        {isAuthor && (
                          <Link 
                            href={`/novel/${novel.id}/episode/${ep.id}/edit`}
                            className="text-[11px] text-purple-600 font-bold hover:underline"
                          >
                            수정하기
                          </Link>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="py-12 text-center text-gray-400 font-medium">등록된 회차가 없습니다.</li>
                )}
              </ul>
            </>
          ) : (
            <div className="space-y-4">
               {novel.notices.length > 0 ? (
                 novel.notices.map(notice => (
                   <Link 
                     key={notice.id} 
                     href={`/novel/${novel.id}/notice/${notice.id}`}
                     className="block p-5 rounded-2xl border border-gray-100 bg-gray-50/30 hover:border-purple-200 hover:bg-purple-50/20 transition-all group"
                   >
                     <div className="flex justify-between items-start mb-2">
                       <h3 className="font-extrabold text-gray-900 group-hover:text-purple-700 transition-colors">{notice.title}</h3>
                       <span className="text-[11px] text-gray-400 font-bold">{new Date(notice.createdAt).toLocaleDateString()}</span>
                     </div>
                     <div className="text-xs text-gray-500 line-clamp-1 mb-3">{notice.content}</div>
                     <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                       <span className="flex items-center gap-1"><Eye size={12}/> {notice.views.toLocaleString()}</span>
                     </div>
                   </Link>
                 ))
               ) : (
                 <div className="py-20 text-center text-gray-400 font-medium border-2 border-dashed border-gray-100 rounded-3xl">
                   등록된 공지사항이 없습니다.
                 </div>
               )}
            </div>
          )}

          <CommentSection 
            novelId={id} 
            title="소설 전체 댓글"
            showInput={false}
            authorId={novel.authorId}
          />
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-10">
          {/* Recommended Works */}
          <div>
            <h2 className="text-[17px] font-extrabold text-gray-900 mb-4">추천 작품</h2>
            <div className="border border-gray-200 p-4 rounded-xl shadow-sm space-y-5">
              {recommendedNovels.length > 0 ? (
                recommendedNovels.map(rec => (
                  <Link key={rec.id} href={`/novel/${rec.id}`} className="flex gap-3 group cursor-pointer">
                    <div className="w-16 h-20 bg-gray-200 rounded-md overflow-hidden shrink-0 relative">
                      <Image src={rec.coverImage || "/placeholder-cover.svg"} alt={rec.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[13px] text-gray-900 leading-tight mb-2 truncate group-hover:text-purple-700 transition-colors">{rec.title}</div>
                      <div className="flex gap-1.5 mb-2">
                        {rec.ageRating === "19세 이용가" ? (
                          <span className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] rounded font-bold">19</span>
                        ) : rec.ageRating === "15세 이용가" ? (
                          <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] rounded font-bold">15</span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-green-600 text-white text-[9px] rounded font-bold">All</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold truncate">
                        {rec.tags?.slice(0, 3).map(t => `#${t.name}`).join(' ')}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">추천 작품이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">신고하기</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {reportTarget?.type === 'COMMENT' ? '이 댓글을 신고하시겠습니까?' : '이 작품을 신고하시겠습니까?'}
              <br/>신고 사유를 간단히 적어주세요.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 min-h-[100px] resize-none mb-6"
              placeholder="신고 사유를 입력하세요..."
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleReport}
                disabled={reporting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {reporting ? "처리 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
