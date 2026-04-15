'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Crown,
  Download,
  FileText,
  FileImage,
  Globe,
  Heart,
  Loader2,
  Lock as LockIcon,
  LogOut,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Pin,
  Plus,
  Send,
  Settings,
  Share2,
  Shield,
  Sparkles,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import type { StudyGroupDetail, GroupMemberRole, PostAttachment } from '@/types';

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
              ? 'bg-gradient-to-br from-slate-100 to-slate-200'
              : 'bg-gradient-to-br from-red-100 to-orange-100'
          }`}>
            {variant === 'join' ? (
              <Users size={28} className="text-slate-600" />
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
                  ? 'bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 hover:shadow-slate-200'
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

// ─── Group Post Types ─────────────────────────────────────────
interface GroupPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorAvatarUrl?: string | null;
  title: string;
  body: string;
  tags: string[];
  images?: string[];
  attachments?: PostAttachment[];
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  liked_by_user: boolean;
  pinned: boolean;
}

const DEFAULT_RULES = [
  'Tôn trọng mọi thành viên',
  'Không spam hoặc quảng cáo',
  'Chia sẻ tài liệu có nguồn gốc',
  'Đăng bài đúng chủ đề nhóm',
];

const avatarColors = [
  'from-slate-800 via-slate-900 to-slate-950',
  'from-emerald-500 to-cyan-500',
  'from-amber-500 to-amber-600',
  'from-indigo-500 to-slate-600',
  'from-slate-600 to-slate-800',
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

// ─── Post Card ─────────────────
function GroupPostCard({ post, isAdmin }: { post: GroupPost; isAdmin: boolean }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likeCount, setLikeCount] = useState(post.likesCount);

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    setLiked(!liked);
    setLikeCount(p => liked ? p - 1 : p + 1);

    try {
      await fetch(`/api/community/${post.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch {
      setLiked(liked);
      setLikeCount(post.likesCount);
    }
  };

  return (
    <article className={`p-5 bg-white rounded-2xl border transition-all hover:shadow-md ${post.pinned ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-100'}`}>
      {post.pinned && (
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-amber-600">
          <Pin size={13} /> Được ghim
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex items-center justify-center w-9 h-9 rounded-full overflow-hidden ${
          post.authorAvatarUrl ? '' : `bg-gradient-to-br ${getAvatarColor(post.authorId)} text-white font-semibold text-xs`
        }`}>
          {post.authorAvatarUrl ? (
            <Image src={post.authorAvatarUrl} alt={post.authorName} width={36} height={36} className="w-full h-full object-cover" />
          ) : (
            post.authorAvatar
          )}
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-800">{post.authorName}</span>
          <span className="text-xs text-gray-400 ml-2">{timeAgo(post.createdAt)}</span>
        </div>
      </div>
      <Link href={`/community/${post.id}`} className="block group">
        {post.title && (
          <h3 className="text-base font-semibold text-gray-800 group-hover:text-slate-600 transition-colors mb-1">
            {post.title}
          </h3>
        )}
        <p className="text-sm text-gray-600 line-clamp-2">{post.body}</p>
      </Link>
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {post.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}
      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {post.attachments.map((att, i) => (
            <a
              key={i}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all group/att"
            >
              {['jpg', 'jpeg', 'png'].includes(att.type) ? (
                <FileImage size={16} className="text-emerald-500 flex-shrink-0" />
              ) : (
                <FileText size={16} className="text-blue-500 flex-shrink-0" />
              )}
              <span className="flex-1 text-sm text-gray-700 truncate group-hover/att:text-blue-600">{att.name}</span>
              <span className="text-xs text-gray-400">{att.type.toUpperCase()}</span>
              <Download size={14} className="text-gray-400 group-hover/att:text-blue-500 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${liked ? 'text-slate-600 bg-slate-50' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Heart size={15} className={liked ? 'fill-slate-500' : ''} />
          {likeCount}
        </button>
        <Link href={`/community/${post.id}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-all">
          <MessageSquare size={15} />
          {post.commentsCount}
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
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [currentUserInitials, setCurrentUserInitials] = useState('SV');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserIsVip, setCurrentUserIsVip] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);
  
  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  const fetchGroupPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/community?groupId=${groupId}`, { headers });
      const data = await res.json();
      if (res.ok && data.data) {
        setGroupPosts(data.data);
      }
    } catch (error) {
    } finally {
      setPostsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
    fetchGroupPosts();
  }, [fetchGroup, fetchGroupPosts]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    setCurrentUserRole(role);
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as { fullName?: string; avatarUrl?: string };
        setCurrentUserAvatar(user.avatarUrl || null);
        setCurrentUserInitials(
          user.fullName ? user.fullName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'SV'
        );
      } catch {}
    }

    // Check VIP status
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/user/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            const u = data.data;
            const now = new Date();
            const vipActive = u.vipPlan && u.vipExpiresAt && new Date(u.vipExpiresAt) > now;
            setCurrentUserIsVip(!!vipActive);
            // Also update role from API
            if (u.role) setCurrentUserRole(u.role);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onAvatarUpdate = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr) as { avatarUrl?: string };
          setCurrentUserAvatar(user.avatarUrl || null);
        } catch {}
      }
    };
    window.addEventListener('user-avatar-updated', onAvatarUpdate);
    return () => window.removeEventListener('user-avatar-updated', onAvatarUpdate);
  }, []);

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

  const handleMemberAction = async (memberId: string, action: 'approve' | 'deny') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setMemberActionLoading(memberId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh group data to update members list
        fetchGroup();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch {
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token || !inviteEmail) return;

    setInviteLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail, message: inviteMessage }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Đã gửi lời mời thành công!');
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteMessage('');
      } else {
        alert(data.message || 'Không thể gửi lời mời');
      }
    } catch {
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Đã sao chép liên kết nhóm!');
  };

  const pendingCount = group?.pendingMembers?.length || 0;

  const tabs: { key: GroupTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'feed', label: 'Bảng tin', icon: <MessageSquare size={16} /> },
    { key: 'members', label: 'Thành viên', icon: <Users size={16} />, badge: isAdmin ? pendingCount : 0 },
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
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full">
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
            <Loader2 size={48} className="mx-auto mb-4 text-slate-400 animate-spin" />
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
            <Link href="/groups" className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
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
                      className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all"
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
                      ? 'bg-slate-50 text-slate-600'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge && tab.badge > 0 ? (
                    <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded-full">
                      {tab.badge}
                    </span>
                  ) : null}
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
                      href={`/community/create?groupId=${groupId}`}
                      className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-slate-200 hover:shadow-sm transition-all"
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ${
                        currentUserAvatar ? '' : 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white font-semibold text-sm'
                      }`}>
                        {currentUserAvatar ? (
                          <Image src={currentUserAvatar} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          currentUserInitials
                        )}
                      </div>
                      <div className="flex-1 px-4 py-2.5 text-sm text-gray-400 bg-gray-50 rounded-xl">
                        Chia sẻ gì đó với nhóm...
                      </div>
                      <Send size={18} className="text-slate-400" />
                    </Link>
                  )}

                  {postsLoading ? (
                    <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
                      <Loader2 size={32} className="mx-auto mb-3 text-slate-400 animate-spin" />
                      <p className="text-sm text-gray-400">Đang tải bài viết...</p>
                    </div>
                  ) : groupPosts.length === 0 ? (
                    <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
                      <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 font-medium">Chưa có bài viết nào</p>
                      <p className="mt-1 text-sm text-gray-400">Hãy là người đầu tiên chia sẻ trong nhóm!</p>
                    </div>
                  ) : (
                    groupPosts.map((post) => (
                      <GroupPostCard key={post.id} post={post} isAdmin={isAdmin} />
                    ))
                  )}
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div className="space-y-3">
                  {/* Pending Members Section (visible to admin only) */}
                  {isAdmin && group.pendingMembers && group.pendingMembers.length > 0 && (
                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-lg">
                          <UserPlus size={16} className="text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-amber-800">
                            Yêu cầu tham gia ({group.pendingMembers.length})
                          </h3>
                          <p className="text-xs text-amber-600">Duyệt hoặc từ chối yêu cầu tham gia nhóm riêng tư</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {group.pendingMembers.map((pending) => (
                          <div
                            key={pending.id}
                            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100"
                          >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden ${
                              pending.avatarUrl ? '' : `bg-gradient-to-br ${getAvatarColor(pending.userId)} text-white font-semibold text-sm`
                            }`}>
                              {pending.avatarUrl ? (
                                <Image src={pending.avatarUrl} alt={pending.name} width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                pending.avatar
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{pending.name}</p>
                              <p className="text-xs text-amber-600">Đang chờ duyệt</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleMemberAction(pending.id, 'approve')}
                                disabled={memberActionLoading === pending.id}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                              >
                                {memberActionLoading === pending.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={12} />
                                )}
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleMemberAction(pending.id, 'deny')}
                                disabled={memberActionLoading === pending.id}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                              >
                                {memberActionLoading === pending.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <XCircle size={12} />
                                )}
                                Từ chối
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-800">{group.membersCount} thành viên</h3>
                    {isAdmin && (
                      <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
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
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden ${
                            member.avatarUrl ? '' : `bg-gradient-to-br ${getAvatarColor(member.userId)} text-white font-semibold text-sm`
                          }`}>
                            {member.avatarUrl ? (
                              <Image src={member.avatarUrl} alt={member.name} width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                              member.avatar
                            )}
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

              {/* Docs Tab */}
              {activeTab === 'docs' && (() => {
                const canAccessDocs = currentUserIsVip || currentUserRole === 'Mentor' || currentUserRole === 'Admin' || currentUserRole === 'Staff';

                if (!canAccessDocs) {
                  return (
                    <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                      <LockIcon size={48} className="mx-auto mb-4 text-amber-400" />
                      <p className="text-gray-700 font-semibold text-lg">Nâng cấp để xem Tài liệu</p>
                      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                        Chỉ thành viên <span className="font-semibold text-amber-600">VIP</span> hoặc <span className="font-semibold text-slate-700">Mentor</span> mới có quyền truy cập kho tài liệu nhóm.
                        Bạn vẫn có thể xem tài liệu đính kèm trực tiếp trên các bài đăng.
                      </p>
                      <Link
                        href="/upgrade"
                        className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-100 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                      >
                        <Sparkles size={16} />
                        Nâng cấp VIP
                      </Link>
                    </div>
                  );
                }

                // Collect all attachments from posts in this group
                const allDocs = groupPosts
                  .filter((p) => p.attachments && p.attachments.length > 0)
                  .flatMap((p) =>
                    (p.attachments || []).map((att) => ({
                      ...att,
                      postId: p.id,
                      postTitle: p.title || 'Bài viết không tiêu đề',
                      authorName: p.authorName,
                      createdAt: p.createdAt,
                    }))
                  );

                if (allDocs.length === 0) {
                  return (
                    <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                      <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 font-medium">Chưa có tài liệu nào</p>
                      <p className="mt-1 text-sm text-gray-400">
                        Tài liệu đính kèm trong bài viết sẽ hiển thị tại đây
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">
                        {allDocs.length} tài liệu
                      </p>
                    </div>
                    {allDocs.map((doc, i) => (
                      <div
                        key={`${doc.postId}-${i}`}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
                      >
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${
                          ['jpg', 'jpeg', 'png'].includes(doc.type) ? 'bg-emerald-100' : doc.type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {['jpg', 'jpeg', 'png'].includes(doc.type) ? (
                            <FileImage size={20} className="text-emerald-600" />
                          ) : doc.type === 'pdf' ? (
                            <FileText size={20} className="text-red-600" />
                          ) : (
                            <FileText size={20} className="text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-400">
                            {doc.type.toUpperCase()} · {doc.authorName} · {timeAgo(doc.createdAt)}
                          </p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
                        >
                          <Download size={14} />
                          Tải xuống
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Tab Sự kiện */}
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
                    <span key={tag} className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 rounded-full">
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
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full overflow-hidden ${
                          admin.avatarUrl ? '' : `bg-gradient-to-br ${getAvatarColor(admin.userId)} text-white font-semibold text-xs`
                        }`}>
                          {admin.avatarUrl ? (
                            <Image src={admin.avatarUrl} alt={admin.name} width={32} height={32} className="w-full h-full object-cover" />
                          ) : (
                            admin.avatar
                          )}
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
                    href={`/community/create?groupId=${groupId}`}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"
                  >
                    <Plus size={16} /> Tạo bài viết
                  </Link>
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"
                  >
                    <UserPlus size={16} /> Mời bạn bè
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"
                  >
                    <Share2 size={16} /> Chia sẻ nhóm
                  </button>
                </div>
              )}

              {/* Group Rules */}
              <div className="p-5 bg-white rounded-2xl border border-gray-100">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">Nội quy nhóm</h3>
                <ol className="space-y-2">
                  {(group.rules && group.rules.length > 0 ? group.rules : DEFAULT_RULES).map((rule, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-600">
                      <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-slate-600 bg-slate-50 rounded-full flex-shrink-0">
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

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !inviteLoading && setShowInviteModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 mb-4 bg-slate-100 rounded-2xl text-slate-600">
                <UserPlus size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Mời thành viên</h3>
              <p className="text-sm text-gray-500">Mời bạn bè tham gia nhóm qua email</p>
            </div>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                  Email người nhận
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 transition-all"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                  Lời nhắn (tùy chọn)
                </label>
                <textarea
                  placeholder="Chào bạn, tham gia nhóm học với mình nhé!"
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 transition-all resize-none"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full py-3 text-sm font-semibold text-white bg-slate-800 rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 hover:shadow-xl transition-all disabled:opacity-50"
              >
                {inviteLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi lời mời'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
