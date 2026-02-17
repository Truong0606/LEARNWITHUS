'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  AlertTriangle,
  ArrowLeft,
  Crown,
  FileText,
  Globe,
  Heart,
  Loader2,
  LogOut,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Pin,
  Plus,
  Send,
  Settings,
  Share2,
  Shield,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { StudyGroupDetail, GroupMemberRole } from '@/types';

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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !loading && onCancel()}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <X size={18} />
        </button>
        <div className="p-6 text-center">
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
          <h3 className="mb-2 text-lg font-bold text-gray-800">{title}</h3>
          <p className="mb-6 text-sm text-gray-600 leading-relaxed">{message}</p>
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

// ─── Mock Posts (will be replaced later) ─────────────────────
interface GroupPost {
  id: string;
  author: { id: string; name: string; avatar: string };
  title: string;
  body: string;
  tags: string[];
  created_at: string;
  likes: number;
  comments: number;
  liked: boolean;
  pinned: boolean;
}

const MOCK_POSTS: GroupPost[] = [
  {
    id: 'gp1',
    author: { id: 'u1', name: 'Nguyễn Hà My', avatar: 'HM' },
    title: 'Tài liệu ôn tập chương 5 - Tích phân',
    body: 'Mình upload file PDF tổng hợp các dạng tích phân thường gặp trong đề thi. Bao gồm: tích phân xác định, suy rộng loại 1 & 2, đổi biến và tích phân từng phần.',
    tags: ['Tài liệu', 'Tích phân'],
    created_at: '1 giờ trước',
    likes: 18,
    comments: 7,
    liked: false,
    pinned: true,
  },
  {
    id: 'gp2',
    author: { id: 'u2', name: 'Trần Đức Anh', avatar: 'ĐA' },
    title: 'Lịch họp tuần này: T5 19:30',
    body: 'Tuần này mình họp vào thứ 5 nhé. Nội dung: review bài tập chương 5 + giải đề thi mẫu. Link Google Meet sẽ gửi trước 30 phút.',
    tags: ['Lịch họp'],
    created_at: '3 giờ trước',
    likes: 12,
    comments: 4,
    liked: true,
    pinned: false,
  },
  {
    id: 'gp3',
    author: { id: 'u3', name: 'Lê Phúc Long', avatar: 'PL' },
    title: 'Hỏi bài tập 5.3 - Tích phân đường',
    body: 'Các bạn ơi giúp mình bài 5.3 với. Mình tính đường cong C nhưng kết quả khác đáp án. Mình đã parameterize r(t) = (cos t, sin t) nhưng...',
    tags: ['Hỏi đáp'],
    created_at: '5 giờ trước',
    likes: 4,
    comments: 6,
    liked: false,
    pinned: false,
  },
];

const GROUP_RULES = [
  'Tôn trọng mọi thành viên',
  'Không spam hoặc quảng cáo',
  'Chia sẻ tài liệu có nguồn gốc',
  'Đăng bài đúng chủ đề nhóm',
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
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

type GroupTab = 'feed' | 'members' | 'docs' | 'events';

// ─── Post Card ─────────────────
function GroupPostCard({ post, isAdmin }: { post: GroupPost; isAdmin: boolean }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);

  return (
    <article className={`p-5 bg-white rounded-2xl border transition-all hover:shadow-md ${post.pinned ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-100'}`}>
      {post.pinned && (
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-amber-600">
          <Pin size={13} /> Được ghim
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(post.author.id)} text-white font-semibold text-xs`}>
          {post.author.avatar}
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-800">{post.author.name}</span>
          <span className="text-xs text-gray-400 ml-2">{post.created_at}</span>
        </div>
      </div>
      <Link href={`/community/${post.id}`} className="block group">
        <h3 className="text-base font-semibold text-gray-800 group-hover:text-violet-600 transition-colors mb-1">
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">{post.body}</p>
      </Link>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {post.tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-full">
            #{tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => { setLiked(!liked); setLikeCount(p => liked ? p - 1 : p + 1); }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${liked ? 'text-pink-600 bg-pink-50' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Heart size={15} className={liked ? 'fill-pink-500' : ''} />
          {likeCount}
        </button>
        <Link href={`/community/${post.id}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-all">
          <MessageSquare size={15} />
          {post.comments}
        </Link>
        {isAdmin && !post.pinned && (
          <button className="flex items-center gap-1 ml-auto px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all">
            <Pin size={13} /> Ghim
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<StudyGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GroupTab>('feed');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isMember = group?.userMembershipStatus === 'member';
  const isAdmin = group?.userMemberRole === 'admin';

  const fetchGroup = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/groups/${groupId}`, { headers });
      const data = await res.json();

      if (res.ok && data.data) {
        setGroup(data.data);
      } else if (res.status === 404) {
        router.push('/groups');
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleJoin = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        setShowJoinModal(false);
        fetchGroup(); // Refetch to get updated data
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

  const handleLeave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        setShowLeaveModal(false);
        fetchGroup();
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

  const tabs: { key: GroupTab; label: string; icon: React.ReactNode }[] = [
    { key: 'feed', label: 'Bảng tin', icon: <MessageSquare size={16} /> },
    { key: 'members', label: 'Thành viên', icon: <Users size={16} /> },
    { key: 'docs', label: 'Tài liệu', icon: <FileText size={16} /> },
    { key: 'events', label: 'Sự kiện', icon: <Settings size={16} /> },
  ];

  const getRoleBadge = (role: GroupMemberRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full">
            <Crown size={12} /> Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-violet-700 bg-violet-100 rounded-full">
            <Shield size={12} /> Mod
          </span>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 size={48} className="mx-auto mb-4 text-violet-400 animate-spin" />
            <p className="text-gray-500">Đang tải thông tin nhóm...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Group not found
  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Không tìm thấy nhóm học</p>
            <Link href="/groups" className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors">
              <ArrowLeft size={16} /> Quay lại danh sách nhóm
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const members = group.members || [];
  const admins = members.filter(m => m.role !== 'member');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {/* Cover Banner */}
        <div className={`relative h-44 sm:h-56 bg-gradient-to-r ${group.coverColor}`}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Link href="/groups" className="inline-flex items-center gap-1.5 mb-3 text-sm text-white/80 hover:text-white transition-colors">
                <ArrowLeft size={16} /> Tất cả nhóm
              </Link>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white sm:text-3xl">{group.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-sm text-white/80">
                      {group.isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                      {group.isPrivate ? 'Riêng tư' : 'Công khai'}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-white/80">
                      <Users size={14} /> {group.membersCount} thành viên
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isMember ? (
                    <>
                      <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all">
                        <Share2 size={16} /> Chia sẻ
                      </button>
                      <button
                        onClick={() => setShowLeaveModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white/80 bg-white/10 rounded-xl hover:bg-red-500/50 hover:text-white transition-all"
                      >
                        <LogOut size={16} /> Rời nhóm
                      </button>
                    </>
                  ) : group.userMembershipStatus === 'pending' ? (
                    <span className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-amber-600 bg-amber-50 rounded-xl">
                      Đang chờ duyệt
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        const token = localStorage.getItem('token');
                        if (!token) {
                          router.push('/login');
                          return;
                        }
                        setShowJoinModal(true);
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-violet-600 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus size={16} /> Tham gia nhóm
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="sticky top-16 z-30 bg-white border-b border-gray-200">
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex gap-1 overflow-x-auto py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? 'bg-violet-50 text-violet-600'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex gap-6">
            {/* Main Column */}
            <div className="flex-1 min-w-0">
              {/* Feed Tab */}
              {activeTab === 'feed' && (
                <div className="space-y-4">
                  {/* Quick Post */}
                  {isMember && (
                    <Link
                      href="/community/create"
                      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white font-semibold text-sm flex-shrink-0">
                        SV
                      </div>
                      <div className="flex-1 px-4 py-2.5 text-sm text-gray-400 bg-gray-50 rounded-xl">
                        Chia sẻ gì đó với nhóm...
                      </div>
                      <Send size={18} className="text-violet-400" />
                    </Link>
                  )}

                  {MOCK_POSTS.map((post) => (
                    <GroupPostCard key={post.id} post={post} isAdmin={isAdmin} />
                  ))}
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-800">{group.membersCount} thành viên</h3>
                    {isAdmin && (
                      <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors">
                        <UserPlus size={16} /> Mời thành viên
                      </button>
                    )}
                  </div>
                  {members.length === 0 ? (
                    <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
                      <Users size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500">Chưa có thành viên nào</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100"
                        >
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(member.userId)} text-white font-semibold text-sm`}>
                            {member.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{member.name}</p>
                            {getRoleBadge(member.role)}
                          </div>
                          {isAdmin && member.role === 'member' && (
                            <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <MoreHorizontal size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Docs Tab (placeholder) */}
              {activeTab === 'docs' && (
                <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">Tài liệu nhóm</p>
                  <p className="mt-1 text-sm text-gray-400">Chức năng đang được phát triển</p>
                </div>
              )}

              {/* Events Tab (placeholder) */}
              {activeTab === 'events' && (
                <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                  <Settings size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium">Sự kiện nhóm</p>
                  <p className="mt-1 text-sm text-gray-400">Chức năng đang được phát triển</p>
                </div>
              )}
            </div>

            {/* Right Sidebar (desktop) */}
            <aside className="hidden lg:block w-72 flex-shrink-0 space-y-5">
              {/* About */}
              <div className="p-5 bg-white rounded-2xl border border-gray-100">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">Giới thiệu</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{group.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(group.subjectTags || []).map((tag) => (
                    <span key={tag} className="px-2.5 py-1 text-xs font-medium text-violet-600 bg-violet-50 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Creator / Admins */}
              {admins.length > 0 && (
                <div className="p-5 bg-white rounded-2xl border border-gray-100">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Quản trị viên</h3>
                  <div className="space-y-3">
                    {admins.map((admin) => (
                      <div key={admin.id} className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(admin.userId)} text-white font-semibold text-xs`}>
                          {admin.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{admin.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{admin.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {isMember && (
                <div className="p-5 bg-white rounded-2xl border border-gray-100 space-y-2">
                  <h3 className="mb-2 text-sm font-semibold text-gray-800">Hành động nhanh</h3>
                  <Link
                    href="/community/create"
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-colors"
                  >
                    <Plus size={16} /> Tạo bài viết
                  </Link>
                  <button className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-colors">
                    <UserPlus size={16} /> Mời bạn bè
                  </button>
                  <button className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 rounded-xl transition-colors">
                    <Share2 size={16} /> Chia sẻ nhóm
                  </button>
                </div>
              )}

              {/* Group Rules */}
              <div className="p-5 bg-white rounded-2xl border border-gray-100">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">Nội quy nhóm</h3>
                <ol className="space-y-2">
                  {GROUP_RULES.map((rule, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-600">
                      <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-violet-600 bg-violet-50 rounded-full flex-shrink-0">
                        {i + 1}
                      </span>
                      {rule}
                    </li>
                  ))}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />

      {/* Join Confirmation Modal */}
      <ConfirmModal
        isOpen={showJoinModal}
        title="Tham gia nhóm học"
        message={`Bạn chắc chắn muốn tham gia nhóm học "${group.name}"?`}
        confirmText="Tham gia"
        cancelText="Hủy"
        variant="join"
        loading={actionLoading}
        onConfirm={handleJoin}
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
        onConfirm={handleLeave}
        onCancel={() => !actionLoading && setShowLeaveModal(false)}
      />
    </div>
  );
}
