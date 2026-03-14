'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  BookOpen,
  Calendar,
  Camera,
  CheckCircle,
  Edit3,
  Flame,
  GraduationCap,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Save,
  Timer,
  Trophy,
  User,
  Users,
  X,
  Shield,
  Crown,
} from 'lucide-react';
import type { StudyGroupWithMembership, GroupMemberRole } from '@/types';

// ─── Types ────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl?: string;
  role: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  joinedGroupsCount: number;
}

interface JoinedGroup {
  id: string;
  name: string;
  coverColor: string;
  membersCount: number;
  subjectTags: string[];
  userMemberRole?: GroupMemberRole;
}

// ─── Avatar helper ────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// role 1 = Admin (full admin access)
const roleLabels: Record<number, string> = {
  0: 'Nhân viên',
  1: 'Quản trị viên',
  2: 'Người dùng',
  3: 'Quản lý',
  4: 'Mentor',
};

// ─── Success Toast ────────────────────────────────────────────
function SuccessToast({ message, show }: { message: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed top-20 right-4 z-[100] flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-emerald-500 rounded-xl shadow-xl shadow-emerald-200 animate-in slide-in-from-right fade-in duration-300">
      <CheckCircle size={18} />
      {message}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Edit form
  const [editData, setEditData] = useState({
    fullName: '',
    phone: '',
    address: '',
  });

  // Joined groups
  const [joinedGroups, setJoinedGroups] = useState<JoinedGroup[]>([]);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const getToken = (): string | null => localStorage.getItem('token');

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      const data = await res.json();
      if (res.ok && data.data) {
        setProfile(data.data);
        setEditData({
          fullName: data.data.fullName,
          phone: data.data.phone,
          address: data.data.address,
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchJoinedGroups = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/groups', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.data) {
        const joined = (data.data as StudyGroupWithMembership[])
          .filter(g => g.userMembershipStatus === 'member')
          .map(g => ({
            id: g.id,
            name: g.name,
            coverColor: g.coverColor,
            membersCount: g.membersCount,
            subjectTags: g.subjectTags || [],
            userMemberRole: g.userMemberRole,
          }));
        setJoinedGroups(joined);
      }
    } catch (error) {
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchJoinedGroups();
  }, [fetchProfile, fetchJoinedGroups]);

  const handleStartEdit = () => {
    if (profile) {
      setEditData({
        fullName: profile.fullName,
        phone: profile.phone,
        address: profile.address,
      });
      setEditErrors({});
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editData.fullName.trim() || editData.fullName.trim().length < 2) {
      errors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (editData.phone.trim()) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(editData.phone.replace(/\s/g, ''))) {
        errors.phone = 'Số điện thoại không hợp lệ';
      }
    }

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: editData.fullName.trim(),
          phone: editData.phone.trim(),
          address: editData.address.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsEditing(false);

        // Update localStorage user info so Header reflects changes
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            user.userName = editData.fullName.trim();
            localStorage.setItem('user', JSON.stringify(user));
          } catch { /* ignore */ }
        }

        // Show success toast
        setSuccessMessage('Cập nhật thông tin thành công!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Refetch
        fetchProfile();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch {
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ảnh không được vượt quá 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/auth/profile/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.data?.avatarUrl) {
        const newAvatarUrl = data.data.avatarUrl;
        setProfile(prev => prev ? { ...prev, avatarUrl: newAvatarUrl } : null);
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr) as { userName: string; role: string; userId: string; avatarUrl?: string };
            localStorage.setItem('user', JSON.stringify({ ...user, avatarUrl: newAvatarUrl }));
            window.dispatchEvent(new Event('user-avatar-updated'));
          } catch {
            // ignore
          }
        }
        setSuccessMessage('Cập nhật ảnh đại diện thành công!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch {
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getRoleBadge = (role?: GroupMemberRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full">
            <Crown size={10} /> Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full">
            <Shield size={10} /> Mod
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
            Thành viên
          </span>
        );
    }
  };

  // ─── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 size={48} className="mx-auto mb-4 text-slate-400 animate-spin" />
            <p className="text-gray-500">Đang tải thông tin...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <User size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">Không tìm thấy thông tin</p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SuccessToast message={successMessage} show={showSuccess} />

      <main>
        {/* Profile Banner */}
        <div className="relative h-40 sm:h-48 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute w-40 h-40 rounded-full top-4 right-12 bg-white/10 blur-3xl" />
          <div className="absolute w-28 h-28 rounded-full bottom-2 left-20 bg-slate-400/20 blur-2xl" />
        </div>

        <div className="px-4 mx-auto max-w-5xl sm:px-6 lg:px-8">
          {/* ─── Avatar + Name + Actions ──────────────────── */}
          <div className="relative -mt-14 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="flex items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white font-bold text-3xl border-4 border-white shadow-xl overflow-hidden hover:opacity-90 transition-opacity disabled:opacity-70"
                >
                  {avatarUploading ? (
                    <Loader2 size={32} className="animate-spin" />
                  ) : profile.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(profile.fullName)
                  )}
                </button>
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Camera size={24} className="text-white" />
                </div>
              </div>

              {/* Name + Meta */}
              <div className="flex-1 min-w-0 sm:pb-1">
                <h1 className="text-2xl font-bold text-white truncate">
                  {profile.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-gray-400" />
                    {profile.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    Tham gia {formatDate(profile.createdAt)}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full">
                    <User size={12} />
                    {roleLabels[profile.role] || 'Người dùng'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:pb-1 flex-shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      <X size={16} /> Hủy
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    <Edit3 size={16} /> Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ─── Two Column Layout ────────────────────────── */}
          <div className="flex flex-col gap-6 pb-12 lg:flex-row">
            {/* ─── Left Column ────────────────────────────── */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Personal Information Card */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                    <User size={18} className="text-slate-600" />
                    Thông tin cá nhân
                  </h2>
                </div>
                <div className="p-6">
                  {isEditing ? (
                    <div className="space-y-5">
                      {/* Full Name */}
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                          Họ và tên <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editData.fullName}
                          onChange={(e) => {
                            setEditData({ ...editData, fullName: e.target.value });
                            if (editErrors.fullName) setEditErrors({ ...editErrors, fullName: '' });
                          }}
                          className={`w-full px-4 py-3 text-sm bg-white border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                            editErrors.fullName ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="Nhập họ và tên..."
                        />
                        {editErrors.fullName && (
                          <p className="mt-1 text-xs text-red-500">{editErrors.fullName}</p>
                        )}
                      </div>

                      {/* Email (readonly) */}
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-4 py-3 text-sm text-gray-500 bg-gray-50 border-2 border-gray-100 rounded-xl cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-400">Email không thể thay đổi</p>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          value={editData.phone}
                          onChange={(e) => {
                            setEditData({ ...editData, phone: e.target.value });
                            if (editErrors.phone) setEditErrors({ ...editErrors, phone: '' });
                          }}
                          className={`w-full px-4 py-3 text-sm bg-white border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                            editErrors.phone ? 'border-red-300' : 'border-gray-200'
                          }`}
                          placeholder="VD: 0912345678"
                        />
                        {editErrors.phone && (
                          <p className="mt-1 text-xs text-red-500">{editErrors.phone}</p>
                        )}
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-700">
                          Địa chỉ
                        </label>
                        <textarea
                          value={editData.address}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all resize-none"
                          placeholder="Nhập địa chỉ..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Full Name */}
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
                          <User size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Họ và tên</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{profile.fullName}</p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex-shrink-0">
                          <Mail size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{profile.email}</p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                          <Phone size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Số điện thoại</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            {profile.phone || <span className="text-gray-400 font-normal italic">Chưa cập nhật</span>}
                          </p>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex-shrink-0">
                          <MapPin size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Địa chỉ</p>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">
                            {profile.address || <span className="text-gray-400 font-normal italic">Chưa cập nhật</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Joined Groups Card */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                    <Users size={18} className="text-slate-600" />
                    Nhóm đã tham gia ({joinedGroups.length})
                  </h2>
                  <Link
                    href="/groups"
                    className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Xem tất cả →
                  </Link>
                </div>
                <div className="p-6">
                  {joinedGroups.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-500">Bạn chưa tham gia nhóm nào</p>
                      <Link
                        href="/groups"
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <Users size={16} /> Khám phá nhóm học
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {joinedGroups.map((group) => (
                        <Link
                          key={group.id}
                          href={`/groups/${group.id}`}
                          className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          {/* Mini cover */}
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${group.coverColor} flex-shrink-0`} />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 group-hover:text-slate-600 transition-colors truncate">
                              {group.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400">{group.membersCount} thành viên</span>
                              {group.subjectTags.length > 0 && (
                                <>
                                  <span className="text-xs text-gray-300">•</span>
                                  <span className="px-1.5 py-0.5 text-xs font-medium text-slate-600 bg-slate-50 rounded">
                                    {group.subjectTags[0]}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Role badge */}
                          {getRoleBadge(group.userMemberRole)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Right Column (Sidebar) ─────────────────── */}
            <aside className="lg:w-80 flex-shrink-0 space-y-5">
              {/* Stats Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Trophy size={16} className="text-amber-500" />
                    Thống kê hoạt động
                  </h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 text-center bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-center w-9 h-9 mx-auto mb-2 rounded-lg bg-slate-100">
                        <BookOpen size={18} className="text-slate-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-800">0</p>
                      <p className="text-xs text-gray-500 mt-0.5">Bài viết</p>
                    </div>
                    <div className="p-3.5 text-center bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-center w-9 h-9 mx-auto mb-2 rounded-lg bg-slate-100">
                        <Users size={18} className="text-slate-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-800">{profile.joinedGroupsCount}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Nhóm học</p>
                    </div>
                    <div className="p-3.5 text-center bg-emerald-50 rounded-xl">
                      <div className="flex items-center justify-center w-9 h-9 mx-auto mb-2 rounded-lg bg-emerald-100">
                        <Timer size={18} className="text-emerald-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-800">0</p>
                      <p className="text-xs text-gray-500 mt-0.5">Phiên Pomodoro</p>
                    </div>
                    <div className="p-3.5 text-center bg-amber-50 rounded-xl">
                      <div className="flex items-center justify-center w-9 h-9 mx-auto mb-2 rounded-lg bg-amber-100">
                        <Flame size={18} className="text-amber-600" />
                      </div>
                      <p className="text-xl font-bold text-gray-800">0</p>
                      <p className="text-xs text-gray-500 mt-0.5">Chuỗi ngày</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning CTA */}
              <div className="p-5 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={18} className="text-amber-300" />
                  <h3 className="font-semibold">Bắt đầu học ngay!</h3>
                </div>
                <p className="mb-4 text-sm text-white/80 leading-relaxed">
                  Sử dụng Pomodoro Timer để tập trung học tập hiệu quả hơn.
                </p>
                <Link
                  href="/pomodoro"
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-slate-600 bg-white rounded-xl hover:shadow-lg transition-all"
                >
                  <Timer size={16} /> Pomodoro Timer
                </Link>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-sm font-semibold text-gray-800">Liên kết nhanh</h3>
                </div>
                <div className="p-3">
                  <Link
                    href="/community"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"
                  >
                    <BookOpen size={16} /> Bảng tin cộng đồng
                  </Link>
                  <Link
                    href="/groups"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"
                  >
                    <Users size={16} /> Tìm nhóm học
                  </Link>
                  <Link
                    href="/pomodoro"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"
                  >
                    <Timer size={16} /> Pomodoro Timer
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"
                  >
                    <GraduationCap size={16} /> Đăng ký Mentor
                  </Link>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-500 bg-white border border-red-100 rounded-2xl hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Đăng xuất
              </button>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
