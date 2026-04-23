"use client";

import { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Loader2, User as UserIcon, CornerDownRight } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface Comment {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  parentId?: number;
  recommends: number;
  dislikes: number;
  episodeNo?: number;
  createdAt: string;
}

interface CommentSectionProps {
  novelId: number;
  episodeId?: number;
  authorId?: string;
  title?: string;
  showInput?: boolean;
}

export default function CommentSection({ 
  novelId, 
  episodeId, 
  authorId,
  title = "댓글", 
  showInput = true 
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const apiPath = episodeId 
    ? `/api/novel/${novelId}/episode/${episodeId}/comments`
    : `/api/novel/${novelId}/comments`;

  useEffect(() => {
    fetchComments();
    checkUser();
  }, [novelId, episodeId]);

  const checkUser = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId?: number) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim() || !user) return;

    setSubmitting(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: content.trim(),
          parentId: parentId
        }),
      });

      if (res.ok) {
        if (parentId) {
          setReplyContent("");
          setReplyTo(null);
        } else {
          setNewComment("");
        }
        fetchComments();
      } else {
        const data = await res.json();
        alert(data.error || "댓글 등록에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (commentId: number, action: 'recommend' | 'dislike') => {
    try {
      const res = await fetch(`/api/comment/${commentId}/${action}`, { method: "POST" });
      if (res.ok) {
        fetchComments();
      } else {
        const data = await res.json();
        alert(data.error || "처리 중 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  // Group comments: parent and its children
  const mainComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: number) => comments.filter(c => c.parentId === parentId).reverse();

  return (
    <div className="mt-12">
      <div className="flex justify-between items-end border-b-2 border-gray-900 pb-3 mb-6">
        <h2 className="text-[19px] font-extrabold text-gray-900">{title} <span className="text-purple-600 ml-1">{comments.length}</span></h2>
      </div>

      {/* Comment Input */}
      {showInput && (
        user ? (
          <form onSubmit={(e) => handleSubmit(e)} className="mb-8">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 shadow-sm transition-all focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="따뜻한 댓글은 작가에게 큰 힘이 됩니다."
                className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-24 placeholder:text-gray-400 font-medium"
              />
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" alt="me" />
                    ) : (
                      <UserIcon size={12} className="w-full h-full p-1 text-gray-400" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-600">{user.user_metadata?.nickname || "나"}</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : "등록"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 text-center mb-8 border-dashed">
            <p className="text-sm text-gray-500 font-bold">로그인 후 댓글을 작성할 수 있습니다.</p>
          </div>
        )
      )}

      {/* Comment List */}
      <div className="space-y-0 divide-y divide-gray-100">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 size={32} className="animate-spin text-purple-600" />
          </div>
        ) : mainComments.length > 0 ? (
          mainComments.map(comment => (
            <div key={comment.id} className="py-8 group">
              {/* Main Comment */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} className="w-full h-full object-cover" alt={comment.userName} />
                    ) : (
                      <UserIcon size={20} className="w-full h-full p-2 text-gray-300" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-black text-[15px] text-gray-900 tracking-tight">{comment.userName}</span>
                    {authorId && comment.userId === authorId && (
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-[9px] rounded-md font-black uppercase tracking-tighter shadow-sm">Author</span>
                    )}
                    {comment.episodeNo && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-bold border border-gray-200/50">EP.{comment.episodeNo}</span>
                    )}
                    <span className="text-[11px] font-bold text-gray-400">
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : '방금 전'}
                    </span>
                  </div>
                  <div className="text-[14px] text-gray-800 leading-relaxed font-medium mb-4">
                    {comment.content}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-400 font-black">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-full px-3 py-1.5 border border-gray-100">
                      <button 
                        onClick={() => handleAction(comment.id, 'recommend')}
                        className="flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                      >
                        <ThumbsUp size={13} /> <span>{comment.recommends}</span>
                      </button>
                      <div className="w-px h-2.5 bg-gray-200"></div>
                      <button 
                        onClick={() => handleAction(comment.id, 'dislike')}
                        className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
                      >
                        <ThumbsDown size={13} /> <span>{comment.dislikes}</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className={`flex items-center gap-1 hover:text-purple-600 transition-colors px-2 py-1 rounded-md ${replyTo === comment.id ? 'text-purple-600 bg-purple-50' : ''}`}
                    >
                      <MessageSquare size={13} /> 답글
                    </button>
                    <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                      <AlertCircle size={13} /> 신고
                    </button>
                  </div>

                  {/* Reply Input */}
                  {replyTo === comment.id && (
                    <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                        <textarea
                          autoFocus
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`@${comment.userName}님에게 답글 작성...`}
                          className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 placeholder:text-purple-300 font-medium"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button 
                            type="button"
                            onClick={() => setReplyTo(null)}
                            className="px-4 py-2 text-gray-500 text-xs font-bold hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || !replyContent.trim()}
                            className="px-5 py-2 bg-purple-600 text-white text-xs font-black rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            {submitting ? <Loader2 size={12} className="animate-spin" /> : "답글 등록"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Replies List */}
                  <div className="mt-4 space-y-4">
                    {getReplies(comment.id).map(reply => (
                      <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-gray-50 bg-gray-50/30 p-4 rounded-r-2xl">
                        <div className="flex-shrink-0 mt-1">
                          <CornerDownRight size={14} className="text-gray-300" />
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm">
                            {reply.userAvatar ? (
                              <img src={reply.userAvatar} className="w-full h-full object-cover" alt={reply.userName} />
                            ) : (
                              <UserIcon size={16} className="w-full h-full p-1.5 text-gray-300" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-[13px] text-gray-900 tracking-tight">{reply.userName}</span>
                            {authorId && reply.userId === authorId && (
                              <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[8px] rounded font-black uppercase tracking-tighter">Author</span>
                            )}
                            <span className="text-[10px] font-bold text-gray-400">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-[13px] text-gray-700 leading-relaxed font-medium">
                            {reply.content}
                          </div>
                          <div className="flex gap-3 mt-2 text-[10px] text-gray-400 font-bold justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleAction(reply.id, 'recommend')}
                              className="hover:text-purple-600 transition-colors"
                            >
                              추천 {reply.recommends}
                            </button>
                            <button 
                              onClick={() => handleAction(reply.id, 'dislike')}
                              className="hover:text-red-500 transition-colors"
                            >
                              비추 {reply.dislikes}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-20 text-center text-gray-400 text-sm font-bold border-t border-gray-50">아직 댓글이 없습니다. 첫 댓글을 남겨보세요! ✨</p>
        )}
      </div>
    </div>
  );
}
