"use client";

import { useState, useEffect } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";

interface Comment {
  id: number;
  userId: string;
  userName: string;
  content: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        setNewComment("");
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

  return (
    <div className="mt-12">
      <div className="flex justify-between items-end border-b-2 border-gray-900 pb-3 mb-6">
        <h2 className="text-[19px] font-extrabold text-gray-900">{title} <span className="text-purple-600 ml-1">{comments.length}</span></h2>
      </div>

      {/* Comment Input */}
      {showInput && (
        user ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="따뜻한 댓글은 작가에게 큰 힘이 됩니다."
                className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 placeholder:text-gray-400 font-medium"
              />
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200/50">
                <span className="text-[11px] text-gray-400 font-medium">비속어 포함 시 제재될 수 있습니다.</span>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : "등록"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center mb-8">
            <p className="text-sm text-gray-500 font-medium">로그인 후 댓글을 작성할 수 있습니다.</p>
          </div>
        )
      )}

      {/* Comment List */}
      <div className="space-y-0 divide-y divide-gray-100">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 size={24} className="animate-spin text-purple-600" />
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="py-6">
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1.5">
                   <span className="font-extrabold text-[14px] text-gray-900">{comment.userName}</span>
                   {authorId && comment.userId === authorId && (
                     <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded font-bold">작가</span>
                   )}
                   {comment.episodeNo && (
                     <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded font-bold">EP.{comment.episodeNo}</span>
                   )}
                   <span className="text-[11px] font-medium text-gray-400">
                     {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : '방금 전'}
                   </span>
                 </div>
                 <div className="text-[13px] text-gray-800 bg-gray-50/80 border border-gray-100 p-3.5 rounded-xl rounded-tl-none inline-block font-medium">
                   {comment.content}
                 </div>
                 <div className="flex gap-4 mt-3 text-[11px] text-gray-400 font-bold justify-end">
                   <button 
                    onClick={() => handleAction(comment.id, 'recommend')}
                    className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                   >
                    <ThumbsUp size={12} /> {comment.recommends}
                   </button>
                   <button 
                    onClick={() => handleAction(comment.id, 'dislike')}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                   >
                    <ThumbsDown size={12} /> {comment.dislikes}
                   </button>
                   <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                    <AlertCircle size={12} /> 신고
                   </button>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <p className="py-12 text-center text-gray-400 text-sm font-medium">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
        )}
      </div>
    </div>
  );
}
