'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Footer, Header } from '@/components/shared';
import {
  Bookmark,
  BookmarkCheck,
  Heart,
  Loader2,
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

// ─── Types ────────────────────────────────────────────────────
interface PostData {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorAvatarUrl?: string | null;
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

// ─── Tab Filter Types ─────────────────────────────────────────
type FeedTab = 'all' | 'group' | 'saved' | 'following';
type TimeFilter = 'all' | 'today' | 'week';

const TRENDING_TAGS = [
  { name: 'Ôn thi cuối kỳ', count: 234 },
  { name: 'React', count: 189 },
  { name: 'AI', count: 156 },
  { name: 'IELTS', count: 143 },
  { name: 'Toán rời rạc', count: 98 },
];

const avatarColors = [
  'from-slate-800 via-slate-900 to-slate-950',
  'from-emerald-500 to-cyan-500',
  'from-amber-500 to-rose-500',
  'from-indigo-500 to-slate-600',
  'from-slate-600 to-slate-800',
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

// ─── Post Card Component ──────────────────────────────────────
function PostCard({ post }: { post: PostData }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.saved_by_user);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Optimistic update
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);

    try {
      await fetch(`/api/community/${post.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch {
      // Revert on error
      setLiked(liked);
      setLikeCount(post.likesCount);
    }
  };

  return (
    <article
      className={`p-5 bg-white rounded-2xl border transition-all hover:shadow-md ${
        post.pinned ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-100'
      }`}
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
            className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${
              post.authorAvatarUrl ? '' : `bg-gradient-to-br ${getAvatarColor(post.authorId)} text-white font-semibold text-sm`
            }`}
          >
            {post.authorAvatarUrl ? (
              <img src={post.authorAvatarUrl} alt={post.authorName} className="w-full h-full object-cover" />
            ) : (
              post.authorAvatar
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">{post.authorName}</span>
              <span className="text-xs text-gray-400">{post.authorTag}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
              {post.groupName && (
                <Link
                  href={`/groups/${post.groupId}`}
                  className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full hover:bg-slate-100 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.groupName}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 3-dots menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}
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
          <h3 className="mb-1.5 text-base font-semibold text-gray-800 group-hover:text-slate-600 transition-colors">
            {post.title}
          </h3>
        )}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{post.body || ''}</p>
        {post.images && post.images.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {post.images.slice(0, 3).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Ảnh ${i + 1}`}
                className="h-24 w-24 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        )}
        {(post.body || '').length > 150 && (
          <span className="text-sm font-medium text-slate-600 mt-1 inline-block">Xem thêm</span>
        )}
      </Link>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 rounded-full cursor-pointer hover:bg-slate-100 transition-colors"
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
                ? 'text-slate-600 bg-slate-50 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-slate-500'
            }`}
            aria-label={liked ? 'Bỏ thích' : 'Thích'}
          >
            <Heart size={16} className={liked ? 'fill-slate-500' : ''} />
            {likeCount}
          </button>
          <Link
            href={`/community/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-slate-500 transition-all"
          >
            <MessageSquare size={16} />
            {post.commentsCount}
          </Link>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-blue-500 transition-all">
            <Share2 size={16} />
            {post.sharesCount}
          </button>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSaved(!saved); }}
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
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestedGroups, setSuggestedGroups] = useState<{ id: string; name: string; membersCount: number; subjectTags: string[] }[]>([]);

  const fetchPosts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/community', { headers });
      const data = await res.json();
      if (res.ok && data.data) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestedGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      if (res.ok && data.data) {
        setSuggestedGroups(data.data.slice(0, 3).map((g: Record<string, unknown>) => ({
          id: g.id,
          name: g.name,
          membersCount: g.membersCount,
          subjectTags: g.subjectTags || [],
        })));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchSuggestedGroups();
  }, [fetchPosts, fetchSuggestedGroups]);

  // Client-side filtering
  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'group' && !p.groupId) return false;
    if (activeTab === 'saved' && !p.saved_by_user) return false;
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.body.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
              className="w-full py-3 pl-11 pr-4 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
            />
          </div>
          <Link
            href="/community/create"
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 hover:-translate-y-0.5 transition-all"
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
                    ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 text-white shadow-md'
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
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
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
            {loading ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                <Loader2 size={48} className="mx-auto mb-4 text-slate-400 animate-spin" />
                <p className="text-gray-500">Đang tải bài viết...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                {activeTab === 'group' ? (
                  <>
                    <p className="text-gray-500 font-medium">Bài viết trong nhóm chỉ hiển thị trong từng nhóm</p>
                    <p className="mt-1 text-sm text-gray-400">Vào trang nhóm để xem bài viết trong nhóm đó</p>
                    <Link
                      href="/groups"
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 rounded-xl"
                    >
                      <Users size={16} /> Xem các nhóm
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 font-medium">Chưa có bài viết nào</p>
                    <p className="mt-1 text-sm text-gray-400">Hãy là người đầu tiên chia sẻ!</p>
                    <Link
                      href="/community/create"
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 rounded-xl"
                    >
                      <Plus size={16} /> Tạo bài viết
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </>
            )}
          </div>

          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:block w-80 flex-shrink-0 space-y-5">
            {/* Trending Topics */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100">
              <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-800">
                <TrendingUp size={16} className="text-slate-600" />
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
                      <span className="text-sm text-gray-700 group-hover:text-slate-600 transition-colors">
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
                <Users size={16} className="text-slate-500" />
                Nhóm gợi ý
              </h3>
              <div className="space-y-3">
                {suggestedGroups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-slate-600 transition-colors">
                        {group.name}
                      </p>
                      <p className="text-xs text-gray-400">{group.membersCount} thành viên</p>
                    </div>
                    {group.subjectTags[0] && (
                      <span className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-50 rounded-full">
                        {group.subjectTags[0]}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
              <Link
                href="/groups"
                className="block mt-3 text-sm font-medium text-center text-slate-600 hover:text-slate-800 transition-colors"
              >
                Xem tất cả nhóm →
              </Link>
            </div>

            {/* Create Group CTA */}
            <div className="p-5 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl text-white">
              <h3 className="mb-2 font-semibold">Tạo nhóm học</h3>
              <p className="mb-4 text-sm text-white/80">
                Lập nhóm riêng cho lớp hoặc môn học của bạn.
              </p>
              <Link
                href="/groups/create"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white rounded-xl hover:shadow-lg transition-all"
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
