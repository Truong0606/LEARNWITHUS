'use client';

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import {
  RefreshCcw,
  GraduationCap,
  MessageSquare,
  Calendar,
  TrendingUp,
  BookOpen,
  CreditCard,
  Banknote,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface MentorBookingDto {
  id: string;
  userId: string;
  mentorId: string;
  mentorName: string;
  userName?: string;
  type: 'session' | 'consultation';
  amount: number;
  status: string;
  scheduledAt: string;
  topic: string;
  paymentId?: string;
  mentorPaid?: boolean;
}

interface Summary {
  totalRevenue: number;
  sessionCount: number;
  consultationCount: number;
}

interface MentorOption {
  id: string;
  fullName: string;
}

export default function AdminMentorBookingsPage() {
  const [bookings, setBookings] = useState<MentorBookingDto[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [mentorFilter, setMentorFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [payingMentor, setPayingMentor] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (mentorFilter) params.set('mentorId', mentorFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const [bookingsRes, mentorsRes] = await Promise.all([
        fetch(`/api/mentor-bookings?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/user?role=4', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (bookingsRes.status === 401 || bookingsRes.status === 403) {
        setError('Bạn không có quyền xem đơn đặt lịch');
        setBookings([]);
        return;
      }

      const bookingsData = await bookingsRes.json();
      if (bookingsData.data) {
        setBookings(bookingsData.data.bookings || []);
        setSummary(bookingsData.data.summary || null);
      }

      if (mentorsRes.ok) {
        const mentorsData = await mentorsRes.json();
        if (mentorsData.data) {
          setMentors(
            (mentorsData.data as { id: string; fullName: string }[]).map((u) => ({
              id: u.id,
              fullName: u.fullName,
            }))
          );
        }
      }
    } catch (err) {
      setError('Không thể tải danh sách đơn đặt lịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, mentorFilter]);

  const handlePayMentor = async (bookingId: string) => {
    if (!confirm('Xác nhận đã thanh toán cho mentor đơn này?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setPayingMentor(bookingId);
    try {
      const res = await fetch(`/api/mentor-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorPaid: true }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch { alert('Có lỗi xảy ra'); }
    finally { setPayingMentor(null); }
  };

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  const typeLabels: Record<string, string> = {
    session: 'Học cùng',
    consultation: 'Tư vấn',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    paid: 'Đã thanh toán',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const platformShare = summary ? Math.round(summary.totalRevenue * 0.2) : 0;
  const mentorShare = summary ? Math.round(summary.totalRevenue * 0.8) : 0;
  const paidToMentorCount = bookings.filter((b) => b.mentorPaid).length;
  const unpaidMentorCount = bookings.filter((b) => b.status === 'completed' && !b.mentorPaid).length;

  return (
    <div className="p-6">
      <DashboardHeader title="Đơn đặt lịch Mentor" />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
        >
          <option value="">Tất cả loại</option>
          <option value="session">Học cùng</option>
          <option value="consultation">Tư vấn</option>
        </select>
        <select
          value={mentorFilter}
          onChange={(e) => setMentorFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
        >
          <option value="">Tất cả mentor</option>
          {mentors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
        />
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <RefreshCcw size={16} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* Summary cards */}
          {summary && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                    <TrendingUp size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tổng doanh thu</p>
                    <p className="text-xl font-bold text-gray-800">
                      {formatPrice(summary.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                    <BookOpen size={24} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Đơn học cùng</p>
                    <p className="text-xl font-bold text-gray-800">{summary.sessionCount}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <MessageSquare size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Đơn tư vấn</p>
                    <p className="text-xl font-bold text-gray-800">
                      {summary.consultationCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-slate-600" />
                  <div>
                    <p className="text-xs text-gray-500">Platform (20%)</p>
                    <p className="text-sm font-bold text-slate-700">
                      {formatPrice(platformShare)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <GraduationCap size={20} className="text-violet-600" />
                  <div>
                    <p className="text-xs text-gray-500">Mentor (80%)</p>
                    <p className="text-sm font-bold text-violet-700">
                      {formatPrice(mentorShare)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mentor payment summary */}
          {(paidToMentorCount > 0 || unpaidMentorCount > 0) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {unpaidMentorCount > 0 && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
                  <Banknote size={16} />
                  {unpaidMentorCount} đơn chờ thanh toán cho mentor
                </div>
              )}
              {paidToMentorCount > 0 && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  <CheckCircle size={16} />
                  {paidToMentorCount} đơn đã thanh toán mentor
                </div>
              )}
            </div>
          )}

          {/* Table */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Người đặt
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Mentor
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Loại
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Chủ đề
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Số tiền
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Trạng thái
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    Ngày hẹn
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">
                    TT Mentor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      {error ? 'Không có dữ liệu' : 'Chưa có đơn đặt lịch nào'}
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4 text-sm text-gray-800">
                        {b.userName || b.userId}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-800">
                        {b.mentorName || b.mentorId}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            b.type === 'session'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {b.type === 'session' ? (
                            <BookOpen size={12} />
                          ) : (
                            <MessageSquare size={12} />
                          )}
                          {typeLabels[b.type] || b.type}
                        </span>
                      </td>
                      <td className="max-w-xs truncate px-4 py-4 text-sm text-gray-600">
                        {b.topic || '—'}
                      </td>
                      <td className="px-4 py-4 font-semibold text-emerald-600">
                        {formatPrice(b.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            b.status === 'completed' || b.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : b.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-700'
                                : b.status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {statusLabels[b.status] || b.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(b.scheduledAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {b.status === 'completed' && !b.mentorPaid ? (
                          <button
                            onClick={() => handlePayMentor(b.id)}
                            disabled={payingMentor === b.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {payingMentor === b.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Banknote size={14} />
                            )}
                            {payingMentor === b.id ? '...' : 'Trả mentor'}
                          </button>
                        ) : b.mentorPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle size={12} />
                            Đã trả
                          </span>
                        ) : b.status === 'cancelled' ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <span className="text-xs text-gray-400">Chưa hoàn thành</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
