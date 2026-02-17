'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Footer, Header } from '@/components/shared';
import {
  Bookmark,
  BookmarkCheck,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  TrendingUp,
  Users,
  Filter,
  Flame,
  Clock,
  Eye,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────
interface Author {
  id: string;
  name: string;
  avatar: string;
  tag: string;
}

interface Post {
  id: string;
  author: Author;
  group_id: string | null;
  group_name: string | null;
  title: string;
  body: string;
  images: string[];
  tags: string[];
  created_at: string;
  counts: { likes: number; comments: number; shares: number };
  liked_by_user: boolean;
  saved_by_user: boolean;
  pinned: boolean;
  read: boolean;
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: { id: 'u1', name: 'Nguyễn Hà My', avatar: 'HM', tag: 'SV - Khoa CNTT' },
    group_id: 'g1',
    group_name: 'Giải tích 1 - Nhóm 7',
    title: 'Cách giải nhanh tích phân suy rộng loại 2?',
    body: 'Mình đang ôn thi cuối kỳ Giải tích 1 mà gặp khó ở phần tích phân suy rộng loại 2. Có bạn nào có mẹo giải nhanh không? Mình đã thử đổi biến nhưng vẫn chưa ra kết quả đúng...',
    images: [],
    tags: ['Toán', 'Giải tích', 'Ôn thi'],
    created_at: '25 phút trước',
    counts: { likes: 24, comments: 12, shares: 3 },
    liked_by_user: false,
    saved_by_user: false,
    pinned: true,
    read: false,
  },
  {
    id: '2',
    author: { id: 'u2', name: 'Trần Đức Anh', avatar: 'ĐA', tag: 'SV - Khoa HTTT' },
    group_id: null,
    group_name: null,
    title: 'Chia sẻ tài liệu React + Next.js 15 cực chi tiết',
    body: 'Mình vừa tổng hợp xong bộ tài liệu học React và Next.js 15 App Router. Bao gồm: Server Components, Client Components, Route Handlers, Server Actions. Bạn nào cần thì comment bên dưới mình gửi nhé!',
    images: [],
    tags: ['Lập trình', 'React', 'Next.js'],
    created_at: '2 giờ trước',
    counts: { likes: 56, comments: 31, shares: 18 },
    liked_by_user: true,
    saved_by_user: true,
    pinned: false,
    read: true,
  },
  {
    id: '3',
    author: { id: 'u3', name: 'Lê Phúc Long', avatar: 'PL', tag: 'SV - Khoa CNTT' },
    group_id: 'g2',
    group_name: 'AI cơ bản - K20',
    title: 'Tìm nhóm làm đồ án cuối kỳ AI',
    body: 'Nhóm mình đang thiếu 1 thành viên cho đồ án cuối kỳ AI. Đề tài: Nhận diện cảm xúc từ text sử dụng BERT. Yêu cầu: biết Python cơ bản, có thể họp online T3/T5 tối.',
    images: [],
    tags: ['AI', 'Đồ án', 'Tìm nhóm'],
    created_at: '4 giờ trước',
    counts: { likes: 8, comments: 5, shares: 2 },
    liked_by_user: false,
    saved_by_user: false,
    pinned: false,
    read: false,
  },
  {
    id: '4',
    author: { id: 'u4', name: 'Phạm Yến Nhi', avatar: 'YN', tag: 'SV - Khoa Kinh tế' },
    group_id: null,
    group_name: null,
    title: 'Kinh nghiệm thi IELTS 7.0 cho sinh viên',
    body: 'Sau 3 tháng ôn luyện, mình vừa đạt IELTS 7.0 (L: 7.5, R: 7.0, W: 6.5, S: 7.0). Mình xin chia sẻ lộ trình ôn tập và tài liệu đã sử dụng. Hi vọng giúp ích cho các bạn đang chuẩn bị thi...',
    images: [],
    tags: ['IELTS', 'Tiếng Anh', 'Kinh nghiệm'],
    created_at: '6 giờ trước',
    counts: { likes: 92, comments: 45, shares: 27 },
    liked_by_user: false,
    saved_by_user: false,
    pinned: false,
    read: true,
  },
  {
    id: '5',
    author: { id: 'u5', name: 'Hoàng Minh Tuấn', avatar: 'MT', tag: 'SV - Khoa CNTT' },
    group_id: 'g3',
    group_name: 'CSDL nâng cao',
    title: 'Hỏi về chuẩn hóa 3NF và BCNF',
    body: 'Có ai giải thích giúp mình sự khác biệt giữa 3NF và BCNF không? Mình đọc slide thầy mà vẫn chưa hiểu lắm, đặc biệt là khi nào thì 3NF và BCNF khác nhau.',
    images: [],
    tags: ['CSDL', 'Chuẩn hóa', 'Hỏi đáp'],
    created_at: '8 giờ trước',
    counts: { likes: 15, comments: 9, shares: 1 },
    liked_by_user: false,
    saved_by_user: false,
    pinned: false,
    read: false,
  },
  {
    id: '6',
    author: { id: 'u6', name: 'Vũ Thị Lan', avatar: 'TL', tag: 'SV - Khoa Toán' },
    group_id: null,
    group_name: null,
    title: 'Review sách "Clean Code" cho người mới học lập trình',
    body: 'Mình vừa đọc xong "Clean Code" của Robert C. Martin. Đây là cuốn sách cực kỳ hữu ích cho ai muốn viết code sạch và dễ bảo trì. Mình tóm tắt những điểm chính và ví dụ cụ thể...',
    images: [],
    tags: ['Review', 'Sách', 'Lập trình'],
    created_at: '1 ngày trước',
    counts: { likes: 67, comments: 22, shares: 14 },
    liked_by_user: true,
    saved_by_user: false,
    pinned: false,
    read: true,
  },
];

const TRENDING_TAGS = [
  { name: 'Ôn thi cuối kỳ', count: 234 },
  { name: 'React', count: 189 },
  { name: 'AI', count: 156 },
  { name: 'IELTS', count: 143 },
  { name: 'Toán rời rạc', count: 98 },
];

const SUGGESTED_GROUPS = [
  { id: 'g1', name: 'Giải tích 1 - Nhóm 7', members: 24, subject: 'Toán' },
  { id: 'g2', name: 'Lập trình Web K21', members: 56, subject: 'CNTT' },
  { id: 'g3', name: 'IELTS 6.5+ Club', members: 89, subject: 'Tiếng Anh' },
];

// ─── Tab Filter Types ─────────────────────────────────────────
type FeedTab = 'all' | 'group' | 'saved' | 'following';
type TimeFilter = 'all' | 'today' | 'week';

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

// ─── Post Card Component ──────────────────────────────────────
function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likeCount, setLikeCount] = useState(post.counts.likes);
  const [saved, setSaved] = useState(post.saved_by_user);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <article
      className={`p-5 bg-white rounded-2xl border transition-all hover:shadow-md ${
        post.pinned ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-100'
      } ${post.read ? 'bg-gray-50/40' : 'bg-white'}`}
    >
      {/* Pinned badge */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-amber-600">
          <Flame size={14} />
          Bài viết được ghim
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
              post.author.id
            )} text-white font-semibold text-sm flex-shrink-0`}
          >
            {post.author.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">{post.author.name}</span>
              <span className="text-xs text-gray-400">{post.author.tag}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">{post.created_at}</span>
              {post.group_name && (
                <Link
                  href={`/groups/${post.group_id}`}
                  className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full hover:bg-violet-100 transition-colors"
                >
                  {post.group_name}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 3-dots menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Tùy chọn bài viết"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
              <button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">Lưu bài viết</button>
              <button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50">Ẩn bài viết</button>
              <button className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-red-50">Báo cáo</button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <Link href={`/community/${post.id}`} className="block group">
        {post.title && (
          <h3 className="mb-1.5 text-base font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">
            {post.title}
          </h3>
        )}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{post.body}</p>
        {post.body.length > 150 && (
          <span className="text-sm font-medium text-violet-600 mt-1 inline-block">Xem thêm</span>
        )}
      </Link>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
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

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              liked
                ? 'text-pink-600 bg-pink-50 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-pink-500'
            }`}
            aria-label={liked ? 'Bỏ thích' : 'Thích'}
          >
            <Heart size={16} className={liked ? 'fill-pink-500' : ''} />
            {likeCount}
          </button>
          <Link
            href={`/community/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-violet-500 transition-all"
          >
            <MessageSquare size={16} />
            {post.counts.comments}
          </Link>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-all">
            <Share2 size={16} />
            {post.counts.shares}
          </button>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className={`p-1.5 rounded-lg transition-all ${
            saved
              ? 'text-amber-500 bg-amber-50'
              : 'text-gray-400 hover:text-amber-500 hover:bg-gray-50'
          }`}
          aria-label={saved ? 'Bỏ lưu' : 'Lưu bài viết'}
        >
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { key: FeedTab; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'group', label: 'Theo nhóm' },
    { key: 'saved', label: 'Yêu thích' },
    { key: 'following', label: 'Mình theo dõi' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Search + Create Row */}
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search size={18} className="absolute text-gray-400 left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm bài, nhóm, môn…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-11 pr-4 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
          <Link
            href="/community/create"
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-pink-200 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} />
            Tạo bài mới
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
            </select>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="flex gap-6">
          {/* Main Feed */}
          <div className="flex-1 min-w-0 space-y-4">
            {MOCK_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Load More */}
            <div className="flex justify-center pt-4 pb-8">
              <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-violet-600 bg-white border-2 border-violet-200 rounded-xl hover:bg-violet-50 transition-all">
                <Eye size={16} />
                Xem thêm bài viết
              </button>
            </div>
          </div>

          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-5">
            {/* Trending Topics */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100">
              <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-800">
                <TrendingUp size={16} className="text-violet-600" />
                Chủ đề thịnh hành
              </h3>
              <div className="space-y-3">
                {TRENDING_TAGS.map((tag, index) => (
                  <div
                    key={tag.name}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-xs font-bold text-gray-400">{index + 1}</span>
                      <span className="text-sm text-gray-700 group-hover:text-violet-600 transition-colors">
                        #{tag.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{tag.count} bài</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Groups */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100">
              <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-800">
                <Users size={16} className="text-pink-500" />
                Nhóm gợi ý
              </h3>
              <div className="space-y-3">
                {SUGGESTED_GROUPS.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-violet-50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-violet-600 transition-colors">
                        {group.name}
                      </p>
                      <p className="text-xs text-gray-400">{group.members} thành viên</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium text-violet-600 bg-violet-50 rounded-full">
                      {group.subject}
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/groups"
                className="block mt-3 text-sm font-medium text-center text-violet-600 hover:text-violet-800 transition-colors"
              >
                Xem tất cả nhóm →
              </Link>
            </div>

            {/* Create Group CTA */}
            <div className="p-5 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl text-white">
              <h3 className="mb-2 font-semibold">Tạo nhóm học</h3>
              <p className="mb-4 text-sm text-white/80">
                Lập nhóm riêng cho lớp hoặc môn học của bạn.
              </p>
              <Link
                href="/groups/create"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-violet-600 bg-white rounded-xl hover:shadow-lg transition-all"
              >
                <Plus size={16} />
                Tạo nhóm mới
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
