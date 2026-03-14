'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  DollarSign,
  Star,
  Users,
  Clock,
  ChevronRight,
  MessageSquare,
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
  Edit3,
  Save,
  X,
  TrendingUp,
  Link as LinkIcon,
  BarChart2,
  Award,
} from 'lucide-react';
import type { MentorProfile } from '@/types';

interface BookingDto {
  id: string;
  userId: string;
  mentorId: string;
  type: 'session' | 'consultation';
  amount: number;
  status: string;
  scheduledAt: string;
  topic: string;
  note?: string;
  userName?: string;
  mentorName?: string;
  reviewId?: string;
  createdAt: string;
  mentorPaid?: boolean;
  meetingLink?: string;
  isFreeVipSession?: boolean;
}

interface MonthlyDataPoint {
  month: string;
  label: string;
  sessions: number;
  earnings: number;
}

interface StatsData {
  overview: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    pendingSessions: number;
    uniqueMentees: number;
    avgRating: number;
    reviewCount: number;
  };
  financials: {
    totalEarnings: number;
    paidEarnings: number;
    pendingEarnings: number;
    sessionRate: number;
  };
  monthlyData: MonthlyDataPoint[];
}

type Tab = 'overview' | 'schedule' | 'bookings' | 'profile';

export default function MentorDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    subject: '',
    subjects: '',
    experience: '',
    availability: '',
    pricePerSession: '',
    bio: '',
    company: '',
    university: '',
    title: '',
    bankName: '',
    bankAccountNumber: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [scheduleWeek, setScheduleWeek] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  // Meeting link state
  const [meetingLinkBookingId, setMeetingLinkBookingId] = useState<string | null>(null);
  const [meetingLinkValue, setMeetingLinkValue] = useState('');
  const [meetingLinkLoading, setMeetingLinkLoading] = useState(false);
  const [meetingLinkMsg, setMeetingLinkMsg] = useState('');
  // Stats state
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return '-'; }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    fetch('/api/mentor/check', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.ok) { setAuthorized(true); } else { setAuthorized(false); router.replace('/mentor/register'); }
      })
      .catch(() => { setAuthorized(false); router.replace('/login'); });
  }, [router]);

  const fetchBookings = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoadingBookings(true);
    try {
      const res = await fetch('/api/mentor-bookings?role=mentor', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.data?.bookings) setBookings(data.data.bookings);
    } catch {}
    finally { setLoadingBookings(false); }
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const res = await fetch(`/api/mentors/${user.userId}`);
      const data = await res.json();
      if (data.data?.profile) {
        const p = data.data.profile;
        setProfile(p);
        setProfileForm({
          fullName: p.fullName || '',
          phone: p.phone || '',
          subject: p.subject || '',
          subjects: (p.subjects || []).join(', '),
          experience: p.experience || '',
          availability: (p.availability || []).join(', '),
          pricePerSession: String(p.pricePerSession || ''),
          bio: p.bio || '',
          company: p.company || '',
          university: p.university || '',
          title: p.title || '',
          bankName: p.bankName || '',
          bankAccountNumber: p.bankAccountNumber || '',
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (authorized) { fetchBookings(); fetchProfile(); }
  }, [authorized, fetchBookings, fetchProfile]);

  const fetchStats = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setStatsLoading(true);
    try {
      const res = await fetch('/api/mentor/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.data) setStats(data.data as StatsData);
    } catch {}
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    if (authorized && !stats) fetchStats();
  }, [authorized, stats, fetchStats]);

  const handleAction = async (bookingId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    const token = getToken();
    if (!token) return;
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/mentor-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchBookings();
      else { const d = await res.json(); alert(d.message || 'Có lỗi'); }
    } catch { alert('Có lỗi xảy ra'); }
    finally { setActionLoading(null); }
  };

  const handleProfileSave = async () => {
    const token = getToken();
    if (!token) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await fetch('/api/mentors', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          phone: profileForm.phone,
          subject: profileForm.subject,
          subjects: profileForm.subjects.split(',').map((s) => s.trim()).filter(Boolean),
          experience: profileForm.experience,
          availability: profileForm.availability.split(',').map((s) => s.trim()).filter(Boolean),
          pricePerSession: parseInt(profileForm.pricePerSession, 10) || 0,
          bio: profileForm.bio,
          company: profileForm.company,
          university: profileForm.university,
          title: profileForm.title,
          bankName: profileForm.bankName,
          bankAccountNumber: profileForm.bankAccountNumber,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg('Cập nhật thành công!');
        setEditingProfile(false);
        fetchProfile();
      } else {
        setProfileMsg(data.message || 'Cập nhật thất bại');
      }
    } catch { setProfileMsg('Có lỗi xảy ra'); }
    finally { setProfileSaving(false); }
  };

  const handleSetMeetingLink = async () => {
    if (!meetingLinkBookingId) return;
    const token = getToken();
    if (!token) return;
    setMeetingLinkLoading(true);
    setMeetingLinkMsg('');
    try {
      const res = await fetch(`/api/mentor-bookings/${meetingLinkBookingId}/meeting-link`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingLink: meetingLinkValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setMeetingLinkMsg('Đã cập nhật link họp thành công!');
        fetchBookings();
        setTimeout(() => { setMeetingLinkBookingId(null); setMeetingLinkMsg(''); }, 1500);
      } else {
        setMeetingLinkMsg(data.message || 'Có lỗi xảy ra');
      }
    } catch { setMeetingLinkMsg('Có lỗi xảy ra'); }
    finally { setMeetingLinkLoading(false); }
  };

  // Computed stats - distinguish received vs awaiting admin payment
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const receivedFromAdmin = completedBookings
    .filter((b) => b.mentorPaid && !b.isFreeVipSession)
    .reduce((sum, b) => sum + Math.round((b.amount || 0) * 0.8), 0);
  const awaitingAdminPayment = completedBookings
    .filter((b) => !b.mentorPaid && !b.isFreeVipSession)
    .reduce((sum, b) => sum + Math.round((b.amount || 0) * 0.8), 0);
  const mentorEarningsTotal = receivedFromAdmin + awaitingAdminPayment;
  const pendingBookings = bookings.filter((b) => ['pending', 'paid', 'confirmed'].includes(b.status));
  const upcomingBookings = bookings
    .filter((b) => ['confirmed', 'paid'].includes(b.status) && new Date(b.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  if (authorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-slate-600" />
      </div>
    );
  }
  if (!authorized) return null;

  const statusLabels: Record<string, string> = {
    pending: 'Chờ duyệt', confirmed: 'Đã chấp nhận', paid: 'Đã thanh toán',
    completed: 'Hoàn thành', cancelled: 'Đã hủy/từ chối',
  };
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700', completed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-4 py-8 mx-auto max-w-6xl sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Mentor</h1>
            <p className="mt-1 text-gray-600">Quản lý lịch tư vấn và thu nhập</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['overview', 'schedule', 'bookings', 'profile'] as Tab[]).map((tab) => {
              const labels: Record<Tab, string> = {
                overview: 'Tổng quan',
                schedule: 'Lịch dạy',
                bookings: 'Đơn đặt lịch',
                profile: 'Hồ sơ',
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === tab ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* === OVERVIEW TAB === */}
        {activeTab === 'overview' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <Calendar size={24} className="text-slate-600" />
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-800">{completedCount}</p>
                <p className="text-sm text-gray-500">Buổi đã hoàn thành</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <DollarSign size={24} className="text-emerald-600" />
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-800">{formatPrice(mentorEarningsTotal)}</p>
                <p className="text-sm text-gray-500">Tổng thu nhập (80%)</p>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>Đã nhận: {formatPrice(receivedFromAdmin)}</p>
                  <p>Chờ admin thanh toán: {formatPrice(awaitingAdminPayment)}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                  <Star size={24} className="text-amber-600" />
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-800">
                  {profile?.rating ? profile.rating.toFixed(1) : '—'}
                </p>
                <p className="text-sm text-gray-500">Đánh giá ({profile?.reviewCount || 0})</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100">
                  <MessageSquare size={24} className="text-cyan-600" />
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-800">{pendingBookings.length}</p>
                <p className="text-sm text-gray-500">Đơn chờ xử lý</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Upcoming Sessions */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="font-semibold text-gray-800">Lịch sắp tới</h3>
                  <button onClick={() => setActiveTab('bookings')} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-700">
                    Xem tất cả <ChevronRight size={16} />
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {upcomingBookings.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-gray-500">Chưa có lịch sắp tới</p>
                  ) : upcomingBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                          {b.type === 'session' ? <BookOpen size={20} className="text-slate-600" /> : <MessageSquare size={20} className="text-slate-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{b.userName || '—'}</p>
                          <p className="text-sm text-gray-500">{b.topic}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">{formatDate(b.scheduledAt)}</p>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[b.status] || ''}`}>
                          {statusLabels[b.status] || b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Requests */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h3 className="font-semibold text-gray-800">Yêu cầu chờ xử lý</h3>
                  {pendingBookings.length > 0 && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {pendingBookings.length} mới
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-50">
                  {pendingBookings.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-gray-500">Không có yêu cầu nào</p>
                  ) : pendingBookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-colors">
                      <div>
                        <p className="font-medium text-gray-800">{b.userName || '—'}</p>
                        <p className="text-sm text-gray-500">{b.topic}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {b.type === 'session' ? 'Học cùng' : 'Tư vấn'} • {formatDate(b.scheduledAt)} • {formatPrice(b.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleAction(b.id, 'confirmed')}
                            disabled={actionLoading === b.id}
                            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                          >
                            {actionLoading === b.id ? '...' : 'Chấp nhận'}
                          </button>
                        )}
                        {b.status === 'paid' && (
                          <button
                            onClick={() => handleAction(b.id, 'confirmed')}
                            disabled={actionLoading === b.id}
                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                          >
                            {actionLoading === b.id ? '...' : 'Xác nhận'}
                          </button>
                        )}
                        {(b.status === 'pending' || b.status === 'paid') && (
                          <button
                            onClick={() => handleAction(b.id, 'cancelled')}
                            disabled={actionLoading === b.id}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                          >
                            Từ chối
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Thống kê chi tiết */}
            {stats && (
              <>
                <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={18} className="text-slate-600" />
                    <h3 className="font-semibold text-gray-800">Thu nhập 6 tháng gần nhất</h3>
                  </div>
                  <div className="flex items-end gap-3 h-40">
                    {stats.monthlyData.map((d) => {
                      const maxEarnings = Math.max(...stats.monthlyData.map((m) => m.earnings), 1);
                      const barH = Math.max((d.earnings / maxEarnings) * 100, 4);
                      return (
                        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                          <p className="text-xs font-medium text-emerald-600 truncate w-full text-center">
                            {d.earnings > 0 ? `${Math.round(d.earnings / 1000)}k` : ''}
                          </p>
                          <div
                            className="w-full rounded-t-lg bg-emerald-400 transition-all"
                            style={{ height: `${barH}%` }}
                            title={`${d.label}: ${formatPrice(d.earnings)} (${d.sessions} buổi)`}
                          />
                          <p className="text-[10px] text-gray-500 truncate w-full text-center">{d.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-violet-600" />
                      <h3 className="text-sm font-semibold text-gray-700">Tỷ lệ hoàn thành</h3>
                    </div>
                    <p className="text-xl font-bold text-gray-800">
                      {stats.overview.totalSessions > 0
                        ? Math.round((stats.overview.completedSessions / stats.overview.totalSessions) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.overview.completedSessions}/{stats.overview.totalSessions} đơn
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={16} className="text-cyan-600" />
                      <h3 className="text-sm font-semibold text-gray-700">Học viên độc lập</h3>
                    </div>
                    <p className="text-xl font-bold text-gray-800">{stats.overview.uniqueMentees}</p>
                    <p className="text-xs text-gray-500 mt-1">Số lượng mentee khác nhau</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Award size={16} className="text-rose-600" />
                      <h3 className="text-sm font-semibold text-gray-700">Phí nền tảng</h3>
                    </div>
                    <p className="text-xl font-bold text-gray-800">20%</p>
                    <p className="text-xs text-gray-500 mt-1">Mentor nhận 80%/buổi</p>
                  </div>
                </div>
              </>
            )}
            {statsLoading && (
              <div className="mt-8 flex justify-center py-8">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            )}
          </>
        )}

        {/* === BOOKINGS TAB === */}
        {activeTab === 'bookings' && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold text-gray-800">Tất cả đơn đặt lịch ({bookings.length})</h3>
            </div>
            {loadingBookings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="px-6 py-12 text-center text-gray-500">Chưa có đơn đặt lịch nào</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Học viên</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Loại</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Chủ đề</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Ngày hẹn</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Số tiền</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{b.userName || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.type === 'session' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {b.type === 'session' ? 'Học cùng' : 'Tư vấn'}
                          </span>
                        </td>
                        <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600">
                          <div className="flex flex-col gap-0.5">
                            <span className="truncate">{b.topic || '—'}</span>
                            {b.meetingLink && (
                              <a href={b.meetingLink} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-500 hover:underline truncate">
                                <LinkIcon size={11} /> Link họp
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(b.scheduledAt)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                          <div className="flex flex-col gap-0.5">
                            <span>{formatPrice(b.amount)}</span>
                            {b.isFreeVipSession && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                                <Award size={10} /> VIP Free
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusColors[b.status] || ''}`}>
                              {statusLabels[b.status] || b.status}
                            </span>
                            {b.status === 'completed' && b.mentorPaid && (
                              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                                Đã nhận tiền
                              </span>
                            )}
                            {b.status === 'completed' && !b.mentorPaid && (
                              <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
                                Chờ thanh toán
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {b.status === 'pending' && (
                              <button
                                onClick={() => handleAction(b.id, 'confirmed')}
                                disabled={actionLoading === b.id}
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                title="Chấp nhận yêu cầu"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            {b.status === 'paid' && (
                              <button
                                onClick={() => handleAction(b.id, 'confirmed')}
                                disabled={actionLoading === b.id}
                                className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                title="Xác nhận đã thanh toán"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            {(b.status === 'confirmed' || b.status === 'paid') && (
                              <button
                                onClick={() => { setMeetingLinkBookingId(b.id); setMeetingLinkValue(b.meetingLink || ''); }}
                                className={`rounded-lg p-1.5 hover:bg-blue-50 ${b.meetingLink ? 'text-blue-600' : 'text-gray-400'}`}
                                title={b.meetingLink ? 'Cập nhật link họp' : 'Thêm link họp'}
                              >
                                <LinkIcon size={18} />
                              </button>
                            )}
                            {(b.status === 'confirmed' || b.status === 'paid') && (
                              <button
                                onClick={() => handleAction(b.id, 'completed')}
                                disabled={actionLoading === b.id}
                                className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                title="Hoàn thành"
                              >
                                <Star size={18} />
                              </button>
                            )}
                            {!['completed', 'cancelled'].includes(b.status) && (
                              <button
                                onClick={() => handleAction(b.id, 'cancelled')}
                                disabled={actionLoading === b.id}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 disabled:opacity-50"
                                title="Hủy"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* === SCHEDULE TAB === */}
        {activeTab === 'schedule' && (() => {
          const SDAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
          const SHOURS = Array.from({ length: 15 }, (_, i) => i + 7);
          const sCols: Record<string, string> = {
            pending: 'border-amber-300 bg-amber-50 text-amber-800',
            paid: 'border-emerald-300 bg-emerald-50 text-emerald-800',
            confirmed: 'border-blue-300 bg-blue-50 text-blue-800',
            completed: 'border-slate-300 bg-slate-50 text-slate-700',
          };
          const sLbls: Record<string, string> = {
            pending: 'Chờ duyệt', paid: 'Đã TT', confirmed: 'Đã chấp nhận', completed: 'Hoàn thành',
          };
          const fmtRange = (mon: Date) => {
            const sun = new Date(mon);
            sun.setDate(sun.getDate() + 6);
            const f = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            return `${f(mon)} – ${f(sun)}`;
          };
          const getDayDate = (mon: Date, idx: number) => {
            const d = new Date(mon);
            d.setDate(d.getDate() + idx);
            return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
          };
          const isTodayCheck = (mon: Date, idx: number) => {
            const d = new Date(mon);
            d.setDate(d.getDate() + idx);
            const t = new Date();
            return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
          };
          const weekBookings = bookings.filter((b) => {
            if (b.status === 'cancelled') return false;
            const d = new Date(b.scheduledAt);
            const end = new Date(scheduleWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
            return d >= scheduleWeek && d < end;
          });
          const getSlot = (dayIdx: number, hour: number) =>
            weekBookings.filter((b) => {
              const d = new Date(b.scheduledAt);
              const mapped = d.getDay() === 0 ? 6 : d.getDay() - 1;
              return mapped === dayIdx && d.getHours() === hour;
            });

          return (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScheduleWeek((p) => { const d = new Date(p); d.setDate(d.getDate() - 7); return d; })}
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-100"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => { const d = new Date(); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day; d.setDate(d.getDate() + diff); d.setHours(0,0,0,0); setScheduleWeek(d); }}
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Tuần hiện tại
                  </button>
                  <button
                    onClick={() => setScheduleWeek((p) => { const d = new Date(p); d.setDate(d.getDate() + 7); return d; })}
                    className="rounded-lg border border-gray-200 p-2 hover:bg-gray-100"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <CalendarDays size={18} className="text-slate-500" />
                  {fmtRange(scheduleWeek)}
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 w-[72px] border-b border-r border-gray-100 bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-500">Giờ</th>
                      {SDAY_LABELS.map((label, i) => (
                        <th key={label} className={`border-b border-r border-gray-100 px-2 py-3 text-center text-xs font-semibold last:border-r-0 ${isTodayCheck(scheduleWeek, i) ? 'bg-slate-800 text-white' : 'bg-gray-50 text-gray-600'}`}>
                          <div>{label}</div>
                          <div className={`text-[11px] font-normal ${isTodayCheck(scheduleWeek, i) ? 'text-slate-300' : 'text-gray-400'}`}>{getDayDate(scheduleWeek, i)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SHOURS.map((hour) => (
                      <tr key={hour}>
                        <td className="sticky left-0 z-10 border-b border-r border-gray-100 bg-gray-50 px-2 py-1 text-center text-xs font-medium text-gray-500">{`${hour}:00`}</td>
                        {SDAY_LABELS.map((_, dayIdx) => {
                          const items = getSlot(dayIdx, hour);
                          return (
                            <td key={dayIdx} className={`relative border-b border-r border-gray-100 p-1 align-top last:border-r-0 ${isTodayCheck(scheduleWeek, dayIdx) ? 'bg-slate-50/40' : ''}`} style={{ minHeight: 56, height: 56 }}>
                              {items.map((b) => (
                                <div key={b.id} className={`mb-1 rounded-lg border-l-[3px] px-2 py-1.5 ${sCols[b.status] || 'border-gray-200 bg-gray-50'}`} title={`${b.topic} — ${b.userName || '—'} (${sLbls[b.status] || b.status})`}>
                                  <div className="flex items-center gap-1">
                                    {b.type === 'session' ? <BookOpen size={12} className="shrink-0" /> : <MessageSquare size={12} className="shrink-0" />}
                                    <span className="truncate text-xs font-semibold">{b.topic}</span>
                                  </div>
                                  <p className="mt-0.5 truncate text-[11px] opacity-75">{b.userName || '—'}</p>
                                  {b.meetingLink && (
                                    <a
                                      href={b.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-1 flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-200"
                                    >
                                      <LinkIcon size={11} />
                                      Link họp
                                    </a>
                                  )}
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-l-[3px] border-amber-300 bg-amber-50" /> Chờ thanh toán</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-l-[3px] border-emerald-300 bg-emerald-50" /> Đã thanh toán</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-l-[3px] border-blue-300 bg-blue-50" /> Đã xác nhận</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border-l-[3px] border-slate-300 bg-slate-50" /> Hoàn thành</span>
              </div>
            </div>
          );
        })()}

        {/* === PROFILE TAB === */}
        {activeTab === 'profile' && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Hồ sơ Mentor</h3>
              {!editingProfile ? (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  <Edit3 size={16} /> Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    <Save size={16} /> {profileSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                  >
                    <X size={16} /> Hủy
                  </button>
                </div>
              )}
            </div>

            {profileMsg && (
              <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${profileMsg.includes('thành công') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {profileMsg}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {([
                { key: 'fullName', label: 'Họ và tên' },
                { key: 'phone', label: 'Số điện thoại' },
                { key: 'subject', label: 'Môn học chính' },
                { key: 'subjects', label: 'Chủ đề (phân cách bởi dấu phẩy)' },
                { key: 'experience', label: 'Kinh nghiệm' },
                { key: 'availability', label: 'Lịch rảnh (phân cách bởi dấu phẩy)' },
                { key: 'pricePerSession', label: 'Giá / buổi (VNĐ)' },
                { key: 'bankName', label: 'Tên ngân hàng' },
                { key: 'bankAccountNumber', label: 'Số tài khoản' },
                { key: 'title', label: 'Chức danh' },
                { key: 'company', label: 'Công ty / Tổ chức' },
                { key: 'university', label: 'Trường học' },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">{label}</label>
                  {editingProfile ? (
                    <input
                      type={key === 'pricePerSession' ? 'number' : 'text'}
                      value={profileForm[key]}
                      onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  ) : (
                    <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-800">
                      {key === 'pricePerSession' ? formatPrice(Number(profileForm[key]) || 0) : (profileForm[key] || '—')}
                    </p>
                  )}
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-sm font-medium text-gray-700">Giới thiệu bản thân</label>
                {editingProfile ? (
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                ) : (
                  <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-800">{profileForm.bio || '—'}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Meeting Link Modal */}
      {meetingLinkBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <LinkIcon size={18} className="text-slate-600" /> Đặt link họp
              </h3>
              <button onClick={() => { setMeetingLinkBookingId(null); setMeetingLinkMsg(''); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Nhập link Google Meet / Zoom / Teams để học viên có thể tham gia buổi học.
            </p>
            <input
              type="url"
              value={meetingLinkValue}
              onChange={(e) => setMeetingLinkValue(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 mb-3"
            />
            {meetingLinkMsg && (
              <p className={`text-sm mb-3 ${meetingLinkMsg.includes('thành công') ? 'text-emerald-600' : 'text-red-600'}`}>
                {meetingLinkMsg}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSetMeetingLink}
                disabled={meetingLinkLoading || !meetingLinkValue.trim()}
                className="flex-1 rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {meetingLinkLoading ? 'Đang lưu...' : 'Lưu link họp'}
              </button>
              <button
                onClick={() => { setMeetingLinkBookingId(null); setMeetingLinkMsg(''); }}
                className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-200"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
