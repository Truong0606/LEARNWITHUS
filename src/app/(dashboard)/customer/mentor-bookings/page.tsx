'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import {
  Calendar,
  BookOpen,
  MessageSquare,
  Star,
  XCircle,
  RefreshCcw,
  ExternalLink,
  CreditCard,
  Loader2,
  Award,
  Video,
  Gift,
} from 'lucide-react';

interface MentorBookingDto {
  id: string;
  mentorId: string;
  mentorName: string;
  type: 'session' | 'consultation';
  amount: number;
  status: string;
  scheduledAt: string;
  topic: string;
  reviewId?: string;
  meetingLink?: string;
  isFreeVipSession?: boolean;
}

interface VipUsage {
  isVip: boolean;
  vipPlan: string | null;
  freeSessionsPerMonth: number;
  freeSessionsUsed: number;
  freeSessionsLeft: number;
  discountPercent: number;
  vipExpiresAt: string | null;
}

export default function CustomerMentorBookingsPage() {
  const [bookings, setBookings] = useState<MentorBookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');
  const [vipUsage, setVipUsage] = useState<VipUsage | null>(null);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return '-'; }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) { window.location.href = '/login'; return; }
      const [bookRes, vipRes] = await Promise.all([
        fetch('/api/mentor-bookings?role=student', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/upgrade/benefits', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const bookData = await bookRes.json();
      if (bookData.data?.bookings) setBookings(bookData.data.bookings);
      if (vipRes.ok) {
        const vipData = await vipRes.json();
        if (vipData.data?.currentUsage) setVipUsage(vipData.data.currentUsage);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handlePay = async (bookingId: string) => {
    const token = getToken();
    if (!token) { window.location.href = '/login'; return; }
    setPayLoading(bookingId);
    try {
      const res = await fetch(`/api/mentor-bookings/${bookingId}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        if (data.data.isFreeSession) {
          alert(data.message || 'Buổi miễn phí VIP! Đặt lịch thành công.');
          fetchBookings();
          return;
        }
        if (data.data.checkoutUrl) {
          window.location.href = data.data.checkoutUrl;
          return;
        }
      }
      alert(data.message || 'Không thể tạo thanh toán');
    } catch { alert('Có lỗi xảy ra khi tạo thanh toán'); }
    finally { setPayLoading(null); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return;
    const token = getToken();
    if (!token) return;
    setCancelLoading(id);
    try {
      const res = await fetch(`/api/mentor-bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchBookings();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch { alert('Có lỗi xảy ra'); }
    finally { setCancelLoading(null); }
  };

  const handleReviewSubmit = async () => {
    if (!showReviewModal) return;
    const booking = bookings.find((b) => b.id === showReviewModal);
    if (!booking) return;
    const token = getToken();
    if (!token) return;
    setReviewLoading(true);
    setReviewMsg('');
    try {
      const res = await fetch('/api/mentor-reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: booking.mentorId,
          bookingId: booking.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewMsg('Đánh giá thành công!');
        setTimeout(() => {
          setShowReviewModal(null);
          setReviewForm({ rating: 5, comment: '' });
          setReviewMsg('');
          fetchBookings();
        }, 1500);
      } else {
        setReviewMsg(data.message || 'Gửi đánh giá thất bại');
      }
    } catch { setReviewMsg('Có lỗi xảy ra'); }
    finally { setReviewLoading(false); }
  };

  const statusLabels: Record<string, string> = {
    pending: 'Chờ thanh toán', confirmed: 'Đã xác nhận', paid: 'Đã thanh toán',
    completed: 'Hoàn thành', cancelled: 'Đã hủy',
  };
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700', completed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="p-6">
      <DashboardHeader title="Lịch hẹn Mentor" />

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <RefreshCcw size={16} /> Làm mới
        </button>
        <Link
          href="/mentors"
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <ExternalLink size={16} /> Tìm Mentor
        </Link>
      </div>

      {/* VIP Usage Banner */}
      {vipUsage?.isVip && (
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Award size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold capitalize">VIP {vipUsage.vipPlan}</p>
                <p className="text-sm text-white/80">
                  {vipUsage.vipExpiresAt
                    ? `Hết hạn: ${new Date(vipUsage.vipExpiresAt).toLocaleDateString('vi-VN')}`
                    : 'Đang hoạt động'}
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xl font-bold">{vipUsage.freeSessionsLeft}</p>
                <p className="text-xs text-white/80">Buổi miễn phí còn lại</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{vipUsage.discountPercent}%</p>
                <p className="text-xs text-white/80">Giảm giá</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{vipUsage.freeSessionsUsed}/{vipUsage.freeSessionsPerMonth}</p>
                <p className="text-xs text-white/80">Đã dùng tháng này</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? <Loading /> : (
        <div className="mt-6 space-y-4">
          {bookings.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <Calendar size={48} className="mx-auto text-gray-300" />
              <p className="mt-4 font-medium text-gray-600">Bạn chưa có lịch hẹn mentor nào</p>
              <Link href="/mentors" className="mt-2 inline-block text-sm text-slate-600 hover:underline">
                Tìm mentor ngay
              </Link>
            </div>
          ) : bookings.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    b.type === 'session' ? 'bg-violet-100' : 'bg-blue-100'
                  }`}>
                    {b.type === 'session' ? <BookOpen size={24} className="text-violet-600" /> : <MessageSquare size={24} className="text-blue-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{b.topic}</p>
                      {b.isFreeVipSession && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                          <Gift size={10} /> VIP Miễn phí
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Mentor: <span className="font-medium text-gray-700">{b.mentorName || '—'}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {formatDate(b.scheduledAt)}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.type === 'session' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {b.type === 'session' ? 'Học cùng' : 'Tư vấn'}
                      </span>
                      {b.meetingLink && ['confirmed', 'paid'].includes(b.status) && (
                        <a
                          href={b.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          <Video size={11} /> Tham gia buổi học
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      {b.isFreeVipSession ? (
                        <span className="text-violet-600">Miễn phí VIP</span>
                      ) : formatPrice(b.amount)}
                    </p>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusColors[b.status] || ''}`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {b.status === 'pending' && (
                      <button
                        onClick={() => handlePay(b.id)}
                        disabled={payLoading === b.id}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {payLoading === b.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <CreditCard size={14} />
                        )}
                        {payLoading === b.id ? 'Đang xử lý...' : 'Thanh toán'}
                      </button>
                    )}
                    {b.status === 'completed' && !b.reviewId && (
                      <button
                        onClick={() => { setShowReviewModal(b.id); setReviewForm({ rating: 5, comment: '' }); }}
                        className="flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-200"
                      >
                        <Star size={14} /> Đánh giá
                      </button>
                    )}
                    {!['completed', 'cancelled'].includes(b.status) && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancelLoading === b.id}
                        className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                      >
                        <XCircle size={14} /> Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Đánh giá buổi học</h3>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Điểm đánh giá</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    className="p-1"
                  >
                    <Star
                      size={28}
                      className={n <= reviewForm.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">Nhận xét</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={4}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            {reviewMsg && (
              <p className={`mb-3 text-sm ${reviewMsg.includes('thành công') ? 'text-emerald-600' : 'text-red-500'}`}>
                {reviewMsg}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReviewSubmit}
                disabled={reviewLoading || !reviewForm.comment.trim()}
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button
                onClick={() => { setShowReviewModal(null); setReviewMsg(''); }}
                className="rounded-xl bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
