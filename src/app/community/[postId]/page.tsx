'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Heart,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsUp,
  CornerDownRight,
  Flag,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────
interface PostData {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTag: string;
  groupId: string | null;
  groupName: string | null;
  title: string;
  body: string;
  tags: string[];
  images: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  pinned: boolean;
  anonymous: boolean;
  createdAt: string;
  liked_by_user: boolean;
  saved_by_user: boolean;
}

interface CommentData {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  parentId: string | null;
  likesCount: number;
  liked: boolean;
  createdAt: string;
  replies?: CommentData[];
}

interface RelatedPost {
  id: string;
  title: string;
  commentsCount: number;
}

const avatarColors = [
  'from-violet-500 to-pink-500',
  'from-emerald-500 to-cyan-500',
  'from-amber-500 to-rose-500',
  'from-indigo-500 to-violet-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  if (isNaN(date)) return dateStr;
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

// ─── Comment Component ────────────────────────────────────────
function CommentItem({
  comment,
  isReply = false,
  onReplySubmit,
}: {
  comment: CommentData;
  isReply?: boolean;
  onReplySubmit: (parentId: string, body: string) => Promise<void>;
}) {
  const [liked, setLiked] = useState(comment.liked);
  const [likeCount, setLikeCount] = useState(comment.likesCount);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleReply = async () => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    try {
      await onReplySubmit(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3">
        <div
          className={`flex items-center justify-center ${
            isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
          } rounded-full bg-gradient-to-br ${getAvatarColor(comment.authorId)} text-white font-semibold flex-shrink-0`}
        >
          {comment.authorAvatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="p-3 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-800">{comment.authorName}</span>
              <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-3 mt-1.5 ml-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                liked ? 'text-pink-600 font-medium' : 'text-gray-400 hover:text-pink-500'
              }`}
            >
              <ThumbsUp size={13} className={liked ? 'fill-pink-500' : ''} />
              {likeCount}
            </button>
            {!isReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-500 transition-colors"
              >
                <CornerDownRight size={13} />
                Trả lời
              </button>
            )}
            <button className="text-xs text-gray-400 hover:text-red-400 transition-colors">
              <Flag size={13} />
            </button>
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="flex gap-2 mt-2 ml-2">
              <input
                type="text"
                placeholder="Viết trả lời..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || replying}
                className={`p-2 rounded-xl transition-all ${
                  replyText.trim() && !replying
                    ? 'text-white bg-gradient-to-r from-violet-500 to-pink-500'
                    : 'text-gray-300 bg-gray-100'
                }`}
              >
                {replying ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply onReplySubmit={onReplySubmit} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchPostDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/community/${postId}`, { headers });
      const data = await res.json();

      if (res.ok && data.data) {
        const { post: p, comments: c, relatedPosts: rp } = data.data;
        setPost(p);
        setComments(c);
        setRelatedPosts(rp);
        setLiked(p.liked_by_user);
        setLikeCount(p.likesCount);
        setSaved(p.saved_by_user);
      } else {
        setError(data.message || 'Không tìm thấy bài viết');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);

    try {
      await fetch(`/api/community/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch {
      setLiked(liked);
      setLikeCount(post?.likesCount || 0);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || commentLoading) return;
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    setCommentLoading(true);
    try {
      const res = await fetch(`/api/community/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: commentText.trim() }),
      });

      if (res.ok) {
        setCommentText('');
        // Refresh comments
        await fetchPostDetail();
      }
    } catch {
      // ignore
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReplySubmit = async (parentId: string, body: string) => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const res = await fetch(`/api/community/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body, parentId }),
    });

    if (res.ok) {
      await fetchPostDetail();
    }
  };

  // Get user initials for comment input
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SV';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 size={48} className="mx-auto mb-4 text-violet-400 animate-spin" />
            <p className="text-gray-500">Đang tải bài viết...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center py-32">
          <div className="text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">{error || 'Không tìm thấy bài viết'}</p>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 mt-4 text-sm text-violet-600 hover:text-violet-800"
            >
              <ArrowLeft size={16} /> Quay lại bảng tin
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Back Button */}
            <Link
              href="/community"
              className="inline-flex items-center gap-2 mb-4 text-sm font-medium text-gray-500 hover:text-violet-600 transition-colors"
            >
              <ArrowLeft size={16} />
              Quay lại bảng tin
            </Link>

            {/* Post Card */}
            <article className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              {/* Author Row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(
                      post.authorId
                    )} text-white font-semibold text-sm`}
                  >
                    {post.authorAvatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{post.authorName}</span>
                      <span className="text-sm text-gray-400">{post.authorTag}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-400">{timeAgo(post.createdAt)}</span>
                      {post.groupName && (
                        <Link
                          href={`/groups/${post.groupId}`}
                          className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full hover:bg-violet-100 transition-colors"
                        >
                          {post.groupName}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                      <button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">Lưu bài viết</button>
                      <button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">Chia sẻ</button>
                      <button className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-red-50">Báo cáo</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Content */}
              {post.title && <h1 className="mb-3 text-xl font-bold text-gray-800">{post.title}</h1>}
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                {post.body}
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium text-violet-600 bg-violet-50 rounded-full cursor-pointer hover:bg-violet-100 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      liked
                        ? 'text-pink-600 bg-pink-50'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-pink-500'
                    }`}
                  >
                    <Heart size={18} className={liked ? 'fill-pink-500' : ''} />
                    {likeCount}
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-violet-500 transition-all">
                    <MessageSquare size={18} />
                    {post.commentsCount}
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-all">
                    <Share2 size={18} />
                    {post.sharesCount}
                  </button>
                </div>
                <button
                  onClick={() => setSaved(!saved)}
                  className={`p-2 rounded-xl transition-all ${
                    saved ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-gray-50'
                  }`}
                >
                  {saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                </button>
              </div>
            </article>

            {/* Comment Input */}
            <div className="flex gap-3 mt-6 p-4 bg-white rounded-2xl border border-gray-100">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold text-sm flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Viết bình luận của bạn..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || commentLoading}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    commentText.trim() && !commentLoading
                      ? 'text-white bg-gradient-to-r from-violet-500 to-pink-500 shadow-md hover:shadow-lg'
                      : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  {commentLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="mt-6 space-y-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <MessageSquare size={18} className="text-violet-600" />
                Bình luận ({comments.length})
              </h3>
              {comments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-400">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} onReplySubmit={handleReplySubmit} />
                ))
              )}
            </div>
          </div>

          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-5">
            {/* Related Posts */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100">
              <h3 className="mb-4 text-sm font-semibold text-gray-800">Bài viết liên quan</h3>
              <div className="space-y-3">
                {relatedPosts.length > 0 ? (
                  relatedPosts.map((rp) => (
                    <Link
                      key={rp.id}
                      href={`/community/${rp.id}`}
                      className="block p-3 rounded-xl hover:bg-violet-50 transition-colors group"
                    >
                      <p className="text-sm font-medium text-gray-800 group-hover:text-violet-600 transition-colors line-clamp-2">
                        {rp.title}
                      </p>
                      <p className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <MessageSquare size={12} /> {rp.commentsCount} bình luận
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Không có bài viết liên quan</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
