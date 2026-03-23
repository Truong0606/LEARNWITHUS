'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import { Loading } from '@/components/shared';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MessageSquare,
  CalendarDays,
  Star,
  RefreshCcw,
  ExternalLink,
} from 'lucide-react';

interface ScheduleBooking {
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
}

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

const statusColors: Record<string, string> = {
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  paid: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  confirmed: 'border-blue-300 bg-blue-50 text-blue-800',
  completed: 'border-slate-300 bg-slate-50 text-slate-700',
  cancelled: 'border-gray-200 bg-gray-50 text-gray-400 line-through',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ TT',
  paid: 'Đã TT',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatWeekRange(monday: Date): string {
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return `${fmt(monday)} - ${fmt(sun)}`;
}

function getDayDate(monday: Date, dayIndex: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function isToday(monday: Date, dayIndex: number): boolean {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayIndex);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export default function SchedulePage() {
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const from = weekStart.toISOString();
      const to = new Date(
        weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1
      ).toISOString();
      const res = await fetch(
        `/api/mentor-bookings?role=student&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.data?.bookings) {
        const activeBookings = (data.data.bookings as ScheduleBooking[]).filter(
          (b) => b.status !== 'cancelled'
        );
        setBookings(activeBookings);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const goToday = () => setWeekStart(getMonday(new Date()));
  const goPrev = () =>
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  const goNext = () =>
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });

  const getBookingsForSlot = (
    dayIndex: number,
    hour: number
  ): ScheduleBooking[] => {
    return bookings.filter((b) => {
      const d = new Date(b.scheduledAt);
      const bookingDay = d.getDay();
      const mappedDay = bookingDay === 0 ? 6 : bookingDay - 1;
      return mappedDay === dayIndex && d.getHours() === hour;
    });
  };

  const handleReviewSubmit = async () => {
    if (!showReviewModal) return;
    const booking = bookings.find((b) => b.id === showReviewModal);
    if (!booking) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setReviewLoading(true);
    setReviewMsg('');
    try {
      const res = await fetch('/api/mentor-reviews', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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
          fetchSchedule();
        }, 1500);
      } else {
        setReviewMsg(data.message || 'Gửi đánh giá thất bại');
      }
    } catch {
      setReviewMsg('Có lỗi xảy ra');
    } finally {
      setReviewLoading(false);
    }
  };

  const canReview = (b: ScheduleBooking) =>
    b.status === 'completed' &&
    b.type === 'consultation' &&
    !b.reviewId;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-4 py-8 mx-auto max-w-6xl sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Thời khóa biểu học với Mentor
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSchedule}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <RefreshCcw size={16} /> Làm mới
            </button>
            <Link
              href="/mentors"
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Tìm Mentor
            </Link>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToday}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Tuần hiện tại
            </button>
            <button
              onClick={goNext}
              className="rounded-lg border border-gray-200 p-2 hover:bg-gray-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CalendarDays size={18} className="text-slate-500" />
            {formatWeekRange(weekStart)}
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-[72px] border-b border-r border-gray-100 bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-500">
                    Giờ
                  </th>
                  {DAY_LABELS.map((label, i) => (
                    <th
                      key={label}
                      className={`border-b border-r border-gray-100 px-2 py-3 text-center text-xs font-semibold last:border-r-0 ${
                        isToday(weekStart, i)
                          ? 'bg-slate-800 text-white'
                          : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      <div>{label}</div>
                      <div
                        className={`text-[11px] font-normal ${
                          isToday(weekStart, i)
                            ? 'text-slate-300'
                            : 'text-gray-400'
                        }`}
                      >
                        {getDayDate(weekStart, i)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour}>
                    <td className="sticky left-0 z-10 border-b border-r border-gray-100 bg-gray-50 px-2 py-1 text-center text-xs font-medium text-gray-500">
                      {`${hour}:00`}
                    </td>
                    {DAY_LABELS.map((_, dayIndex) => {
                      const items = getBookingsForSlot(dayIndex, hour);
                      return (
                        <td
                          key={dayIndex}
                          className={`relative border-b border-r border-gray-100 p-1 align-top last:border-r-0 ${
                            isToday(weekStart, dayIndex)
                              ? 'bg-slate-50/40'
                              : ''
                          }`}
                          style={{ minHeight: 56, height: 56 }}
                        >
                          {items.map((b) => (
                            <div
                              key={b.id}
                              className={`group relative mb-1 rounded-lg border-l-[3px] px-2 py-1.5 ${statusColors[b.status] || 'border-gray-200 bg-gray-50'}`}
                              title={`${b.topic} - ${b.mentorName} (${statusLabels[b.status] || b.status})`}
                            >
                              <div className="flex items-center gap-1">
                                {b.type === 'session' ? (
                                  <BookOpen size={12} className="shrink-0" />
                                ) : (
                                  <MessageSquare size={12} className="shrink-0" />
                                )}
                                <span className="truncate text-xs font-semibold">
                                  {b.topic}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[11px] opacity-75">
                                {b.mentorName}
                              </p>
                              {b.meetingLink && ['paid', 'confirmed', 'completed'].includes(b.status) && (
                                <a
                                  href={b.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-200"
                                >
                                  <ExternalLink size={11} />
                                  Vào link học
                                </a>
                              )}
                              {canReview(b) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowReviewModal(b.id);
                                    setReviewForm({ rating: 5, comment: '' });
                                  }}
                                  className="mt-1 flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-200"
                                >
                                  <Star size={12} />
                                  Đánh giá
                                </button>
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
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border-l-[3px] border-amber-300 bg-amber-50" />
            Chờ thanh toán
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border-l-[3px] border-emerald-300 bg-emerald-50" />
            Đã thanh toán
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border-l-[3px] border-blue-300 bg-blue-50" />
            Đã xác nhận
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded border-l-[3px] border-slate-300 bg-slate-50" />
            Hoàn thành
          </span>
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Đánh giá buổi tư vấn
            </h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Điểm đánh giá
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() =>
                      setReviewForm({ ...reviewForm, rating: n })
                    }
                    className="p-1"
                  >
                    <Star
                      size={28}
                      className={
                        n <= reviewForm.rating
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-gray-200'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nhận xét
              </label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, comment: e.target.value })
                }
                rows={4}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReviewSubmit}
                disabled={
                  reviewLoading || !reviewForm.comment.trim()
                }
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(null);
                  setReviewMsg('');
                }}
                className="rounded-xl bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
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
