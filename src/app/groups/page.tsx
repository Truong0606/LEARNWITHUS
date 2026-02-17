'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  AlertTriangle,
  Globe,
  Lock,
  LogOut,
  Plus,
  Search,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Filter,
  Flame,
  X,
  Loader2,
} from 'lucide-react';
import type { StudyGroupWithMembership, GroupMembershipStatus } from '@/types';

// ─── Types ────────────────────────────────────────────────────
type SortOption = 'popular' | 'new' | 'recommended';
type PrivacyFilter = 'all' | 'public' | 'private';

// ─── Confirmation Modal ──────────────────────────────────────
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'join' | 'leave';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Hủy',
  variant = 'join',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <X size={18} />
        </button>

        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl ${
            variant === 'join'
              ? 'bg-gradient-to-br from-violet-100 to-pink-100'
              : 'bg-gradient-to-br from-red-100 to-orange-100'
          }`}>
            {variant === 'join' ? (
              <Users size={28} className="text-violet-600" />
            ) : (
              <AlertTriangle size={28} className="text-red-500" />
            )}
          </div>

          {/* Content */}
          <h3 className="mb-2 text-lg font-bold text-gray-800">{title}</h3>
          <p className="mb-6 text-sm text-gray-600 leading-relaxed">{message}</p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:shadow-lg disabled:opacity-70 ${
                variant === 'join'
                  ? 'bg-gradient-to-r from-violet-500 to-pink-500 hover:shadow-violet-200'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-red-200'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subject filters & Trending ──────────────────────────────
const SUBJECTS_FILTER = [
  'Tất cả', 'Toán', 'CNTT', 'AI', 'CSDL', 'Tiếng Anh', 'Kinh tế', 'Vật lý',
];

const TRENDING_TAGS = [
  { name: 'Ôn thi cuối kỳ', count: 12 },
  { name: 'React', count: 8 },
  { name: 'Machine Learning', count: 6 },
  { name: 'IELTS', count: 5 },
];

// ─── Group Card ───────────────────────────────────────────────
function GroupCard({
  group,
  onMembershipChange,
}: {
  group: StudyGroupWithMembership;
  onMembershipChange: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<GroupMembershipStatus>(group.userMembershipStatus);
  const [memberCount, setMemberCount] = useState(group.membersCount);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Sync when parent data changes
  useEffect(() => {
    setStatus(group.userMembershipStatus);
    setMemberCount(group.membersCount);
  }, [group.userMembershipStatus, group.membersCount]);

  const getToken = (): string | null => {
    return localStorage.getItem('token');
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    if (status === 'none') {
      setShowJoinModal(true);
    }
  };

  const handleConfirmJoin = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        // Update local state based on API response
        const newStatus: GroupMembershipStatus = data.data?.status === 'active' ? 'member' : 'pending';
        setStatus(newStatus);
        if (newStatus === 'member') {
          setMemberCount(prev => prev + 1);
        }
        setShowJoinModal(false);
        onMembershipChange(); // Trigger refetch for consistency
      } else {
        alert(data.message || 'Có lỗi xảy ra');
        setShowJoinModal(false);
      }
    } catch {
      alert('Lỗi kết nối. Vui lòng thử lại.');
      setShowJoinModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('none');
        setMemberCount(prev => Math.max(0, prev - 1));
        setShowLeaveModal(false);
        onMembershipChange();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
        setShowLeaveModal(false);
      }
    } catch {
      alert('Lỗi kết nối. Vui lòng thử lại.');
      setShowLeaveModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const renderJoinButton = () => {
    switch (status) {
      case 'member':
        return (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg">
              <CheckCircle size={14} />
              Đã tham gia
            </span>
            <button
              onClick={handleLeaveClick}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              title="Rời nhóm"
            >
              <LogOut size={13} />
            </button>
          </div>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg">
            <Clock size={14} />
            Đã gửi yêu cầu
          </span>
        );
      default:
        return (
          <button
            onClick={handleJoinClick}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-pink-500 rounded-lg hover:shadow-md transition-all"
          >
            Tham gia
          </button>
        );
    }
  };

  return (
    <>
      <Link href={`/groups/${group.id}`} className="block group">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all">
          {/* Cover */}
          <div className={`h-28 bg-gradient-to-r ${group.coverColor} relative`}>
            <div className="absolute inset-0 bg-black/10" />
            {group.isPrivate ? (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-black/30 backdrop-blur-sm rounded-full">
                <Lock size={12} />
                Riêng tư
              </div>
            ) : (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-black/30 backdrop-blur-sm rounded-full">
                <Globe size={12} />
                Công khai
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="text-base font-semibold text-gray-800 group-hover:text-violet-600 transition-colors line-clamp-1">
              {group.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-1">{group.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(group.subjectTags || []).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Users size={14} />
                <span>{memberCount} thành viên</span>
              </div>
              {renderJoinButton()}
            </div>
          </div>
        </div>
      </Link>

      {/* Join Confirmation Modal */}
      <ConfirmModal
        isOpen={showJoinModal}
        title="Tham gia nhóm học"
        message={`Bạn chắc chắn muốn tham gia nhóm học "${group.name}"?`}
        confirmText="Tham gia"
        cancelText="Hủy"
        variant="join"
        loading={actionLoading}
        onConfirm={handleConfirmJoin}
        onCancel={() => !actionLoading && setShowJoinModal(false)}
      />

      {/* Leave Confirmation Modal */}
      <ConfirmModal
        isOpen={showLeaveModal}
        title="Rời nhóm học"
        message={`Bạn chắc chắn muốn rời nhóm học tập "${group.name}"? Bạn sẽ không còn nhận được thông báo và bài viết từ nhóm này.`}
        confirmText="Rời nhóm"
        cancelText="Ở lại"
        variant="leave"
        loading={actionLoading}
        onConfirm={handleConfirmLeave}
        onCancel={() => !actionLoading && setShowLeaveModal(false)}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function GroupsPage() {
  const [groups, setGroups] = useState<StudyGroupWithMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState('Tất cả');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>('all');

  const fetchGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/groups', { headers });
      const data = await res.json();

      if (res.ok && data.data) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = groups.filter((g) => {
    const tags = g.subjectTags || [];
    if (activeSubject !== 'Tất cả' && !tags.some(t => t.includes(activeSubject))) return false;
    if (privacyFilter === 'public' && g.isPrivate) return false;
    if (privacyFilter === 'private' && !g.isPrivate) return false;
    if (searchQuery && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Sort
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    if (sortBy === 'popular') return b.membersCount - a.membersCount;
    if (sortBy === 'new') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nhóm học</h1>
            <p className="text-sm text-gray-500 mt-1">Khám phá và tham gia nhóm học theo môn hoặc lớp</p>
          </div>
          <Link
            href="/groups/create"
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-pink-500 rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-pink-200 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} />
            Tạo nhóm mới
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 max-w-xl">
          <Search size={18} className="absolute text-gray-400 left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm nhóm theo môn hoặc tên lớp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-11 pr-4 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Subject Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            {SUBJECTS_FILTER.map((subject) => (
              <button
                key={subject}
                onClick={() => setActiveSubject(subject)}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeSubject === subject
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>

          {/* Sort & Privacy */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Filter size={14} className="text-gray-400" />
              <select
                value={privacyFilter}
                onChange={(e) => setPrivacyFilter(e.target.value as PrivacyFilter)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">Tất cả</option>
                <option value="public">Công khai</option>
                <option value="private">Riêng tư</option>
              </select>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="popular">Phổ biến</option>
              <option value="new">Mới nhất</option>
              <option value="recommended">Gợi ý</option>
            </select>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="flex gap-6">
          {/* Group Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                <Loader2 size={48} className="mx-auto mb-4 text-violet-400 animate-spin" />
                <p className="text-gray-500">Đang tải danh sách nhóm...</p>
              </div>
            ) : sortedGroups.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Không tìm thấy nhóm nào phù hợp</p>
                <p className="mt-1 text-sm text-gray-400">Thử thay đổi bộ lọc hoặc tạo nhóm mới</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {sortedGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onMembershipChange={fetchGroups}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-5">
            {/* Trending Tags */}
            <div className="p-5 bg-white rounded-2xl border border-gray-100">
              <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-800">
                <TrendingUp size={16} className="text-violet-600" />
                Tags thịnh hành
              </h3>
              <div className="space-y-3">
                {TRENDING_TAGS.map((tag) => (
                  <div key={tag.name} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-gray-700 group-hover:text-violet-600 transition-colors">
                      #{tag.name}
                    </span>
                    <span className="text-xs text-gray-400">{tag.count} nhóm</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="p-5 bg-gradient-to-br from-violet-500 to-pink-500 rounded-2xl text-white">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={18} className="text-amber-300" />
                <h3 className="font-semibold">Tạo nhóm riêng</h3>
              </div>
              <p className="mb-4 text-sm text-white/80">
                Lập nhóm cho lớp hoặc môn học, mời bạn bè cùng tham gia.
              </p>
              <Link
                href="/groups/create"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-violet-600 bg-white rounded-xl hover:shadow-lg transition-all"
              >
                <Plus size={16} />
                Tạo nhóm ngay
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
