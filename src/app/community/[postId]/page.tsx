'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsUp,
  CornerDownRight,
  Flag,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────
interface Comment {
  id: string;
  author: { id: string; name: string; avatar: string };
  body: string;
  created_at: string;
  likes_count: number;
  liked: boolean;
  parent_id: string | null;
  replies?: Comment[];
}

const MOCK_POST = {
  id: '1',
  author: { id: 'u1', name: 'Nguyễn Hà My', avatar: 'HM', tag: 'SV - Khoa CNTT' },
  group_id: 'g1',
  group_name: 'Giải tích 1 - Nhóm 7',
  title: 'Cách giải nhanh tích phân suy rộng loại 2?',
  body: `Mình đang ôn thi cuối kỳ Giải tích 1 mà gặp khó ở phần tích phân suy rộng loại 2. Có bạn nào có mẹo giải nhanh không?

Cụ thể là dạng:
∫(0→1) 1/√(1-x²) dx

Mình đã thử đổi biến x = sin(t) nhưng khi tính giới hạn thì bị lỗi ở bước xét hội tụ. Không biết mình sai ở đâu.

Bạn nào có kinh nghiệm giải dạng này share giúp mình với! Cảm ơn mọi người nhiều 🙏

Thêm nữa, nếu có tài liệu hay slide nào tổng hợp các dạng tích phân suy rộng thì chia sẻ giúp mình luôn nhé. Tuần sau thi rồi 😢`,
  images: [],
  tags: ['Toán', 'Giải tích', 'Ôn thi'],
  created_at: '25 phút trước',
  counts: { likes: 24, comments: 8, shares: 3 },
  liked_by_user: false,
  saved_by_user: false,
};

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    author: { id: 'u2', name: 'Trần Đức Anh', avatar: 'ĐA' },
    body: 'Dạng này bạn đổi biến x = sin(t), khi x→1 thì t→π/2. Kết quả là π/2. Bạn kiểm tra lại bước đổi cận nhé, chắc bước đó bị nhầm.',
    created_at: '20 phút trước',
    likes_count: 8,
    liked: false,
    parent_id: null,
    replies: [
      {
        id: 'c1r1',
        author: { id: 'u1', name: 'Nguyễn Hà My', avatar: 'HM' },
        body: 'À mình hiểu rồi! Mình nhầm cận ở bước đổi biến. Cảm ơn bạn nhiều!',
        created_at: '15 phút trước',
        likes_count: 2,
        liked: false,
        parent_id: 'c1',
      },
    ],
  },
  {
    id: 'c2',
    author: { id: 'u3', name: 'Lê Phúc Long', avatar: 'PL' },
    body: 'Mình có file PDF tổng hợp các dạng tích phân suy rộng. Bạn gửi email mình share cho nhé!',
    created_at: '10 phút trước',
    likes_count: 12,
    liked: true,
    parent_id: null,
    replies: [],
  },
  {
    id: 'c3',
    author: { id: 'u4', name: 'Phạm Yến Nhi', avatar: 'YN' },
    body: 'Mẹo: với dạng tích phân suy rộng loại 2, luôn kiểm tra xem hàm có bị gián đoạn ở đâu trên đoạn lấy tích phân. Rồi tách ra thành giới hạn. Cái này slide chương 5 của thầy Hùng có giải chi tiết đó.',
    created_at: '5 phút trước',
    likes_count: 5,
    liked: false,
    parent_id: null,
    replies: [],
  },
];

const RELATED_POSTS = [
  { id: '2', title: 'Chia sẻ tài liệu React + Next.js 15', comments: 31 },
  { id: '4', title: 'Kinh nghiệm thi IELTS 7.0', comments: 45 },
  { id: '5', title: 'Hỏi về chuẩn hóa 3NF và BCNF', comments: 9 },
];

const avatarColors = [
  'from-violet-500 to-pink-500',
  'from-emerald-500 to-cyan-500',
  'from-amber-500 to-rose-500',
  'from-indigo-500 to-violet-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
];

function getAvatarColor(id: string) {
  const index = id.charCodeAt(1) % avatarColors.length;
  return avatarColors[index];
}

// ─── Comment Component ────────────────────────────────────────
function CommentItem({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) {
  const [liked, setLiked] = useState(comment.liked);
  const [likeCount, setLikeCount] = useState(comment.likes_count);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3">
        <div
          className={`flex items-center justify-center ${
            isReply ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
          } rounded-full bg-gradient-to-br ${getAvatarColor(comment.author.id)} text-white font-semibold flex-shrink-0`}
        >
          {comment.author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="p-3 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-800">{comment.author.name}</span>
              <span className="text-xs text-gray-400">{comment.created_at}</span>
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
                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                autoFocus
              />
              <button
                disabled={!replyText.trim()}
                className={`p-2 rounded-xl transition-all ${
                  replyText.trim()
                    ? 'text-white bg-gradient-to-r from-violet-500 to-pink-500'
                    : 'text-gray-300 bg-gray-100'
                }`}
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function PostDetailPage() {
  const params = useParams();
  const [liked, setLiked] = useState(MOCK_POST.liked_by_user);
  const [likeCount, setLikeCount] = useState(MOCK_POST.counts.likes);
  const [saved, setSaved] = useState(MOCK_POST.saved_by_user);
  const [commentText, setCommentText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

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
                      MOCK_POST.author.id
                    )} text-white font-semibold text-sm`}
                  >
                    {MOCK_POST.author.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{MOCK_POST.author.name}</span>
                      <span className="text-sm text-gray-400">{MOCK_POST.author.tag}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-gray-400">{MOCK_POST.created_at}</span>
                      {MOCK_POST.group_name && (
                        <Link
                          href={`/groups/${MOCK_POST.group_id}`}
                          className="text-xs font-medium text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full hover:bg-violet-100 transition-colors"
                        >
                          {MOCK_POST.group_name}
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
              <h1 className="mb-3 text-xl font-bold text-gray-800">{MOCK_POST.title}</h1>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
                {MOCK_POST.body}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {MOCK_POST.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs font-medium text-violet-600 bg-violet-50 rounded-full cursor-pointer hover:bg-violet-100 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

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
                    {MOCK_POST.counts.comments}
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-all">
                    <Share2 size={18} />
                    {MOCK_POST.counts.shares}
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
                SV
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Viết bình luận của bạn..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
                <button
                  disabled={!commentText.trim()}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    commentText.trim()
                      ? 'text-white bg-gradient-to-r from-violet-500 to-pink-500 shadow-md hover:shadow-lg'
                      : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="mt-6 space-y-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <MessageSquare size={18} className="text-violet-600" />
                Bình luận ({MOCK_COMMENTS.length})
              </h3>
              {MOCK_COMMENTS.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}

              {/* Load more comments */}
              <div className="flex justify-center pt-2">
                <button className="text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors">
                  Xem thêm bình luận →
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-5">
            {/* Related Posts */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100">
              <h3 className="mb-4 text-sm font-semibold text-gray-800">Bài viết liên quan</h3>
              <div className="space-y-3">
                {RELATED_POSTS.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/community/${rp.id}`}
                    className="block p-3 rounded-xl hover:bg-violet-50 transition-colors group"
                  >
                    <p className="text-sm font-medium text-gray-800 group-hover:text-violet-600 transition-colors line-clamp-2">
                      {rp.title}
                    </p>
                    <p className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <MessageSquare size={12} /> {rp.comments} bình luận
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
