'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  Star,
  GraduationCap,
  Calendar,
  Clock,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Users,
  BookOpen,
  ClipboardList,
  X,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import type { MentorProfile, MentorReview, MentorCourse } from '@/types';

interface UserInfo {
  userId: string;
  role: string;
  fullName?: string;
  vipPlan?: string | null;
  isMentor?: boolean;
}

interface BookingOrder {
  id: string;
  mentorId?: string;
  type: string;
  topic: string;
  status: string;
  amount: number;
  scheduledAt: string;
  mentorName?: string;
  createdAt: string;
}

const levelLabels: Record<string, string> = {
  beginner: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  paid: 'Đã thanh toán',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy / Bị từ chối',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function MentorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = typeof params.id === 'string' ? params.id : params.id?.[0];

  const [mentor, setMentor] = useState<MentorProfile | null>(null);
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [courses, setCourses] = useState<MentorCourse[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // Talk to Mentor modal
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    preferredSlot: '',
    topic: '',
    note: '',
    type: 'consultation' as 'session' | 'consultation',
  });
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});

  // Order management modal
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState<BookingOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch current user info
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setCurrentUser(data.data as UserInfo);
        }
      } catch { /* ignore */ }
    };
    fetchUser();
  }, []);

  // Fetch mentor (includes reviews + courses in one request)
  useEffect(() => {
    if (!mentorId) return;
    const fetchData = async () => {
      setPageLoading(true);
      try {
        const res = await fetch(`/api/mentors/${mentorId}`);
        const data = await res.json();
        if (data.data) {
          setMentor(data.data.profile);
          setReviews(data.data.reviews || []);
          setCourses(Array.isArray(data.data.courses) ? data.data.courses : []);
        }
      } catch {
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [mentorId]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[parts.length - 2][0] + parts[parts.length - 1][0];
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Check if current user is this mentor
  const isThisMentor = currentUser && mentor && currentUser.userId === mentor.userId;
  // All logged-in users except this mentor can send requests
  const canRequest = currentUser && !isThisMentor;

  // Vietnamese day name -> day of week
  const vietnameseToDayNum: Record<string, number> = {
    'Chủ nhật': 0, 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 5, 'Thứ 7': 6,
  };
  const slotToHour: Record<string, number> = { 'Sáng': 9, 'Chiều': 14, 'Tối': 19 };

  // Danh sách khung giờ rảnh của mentor (chọn trực tiếp)
  const availableSlots = useMemo(() => {
    const avail = Array.isArray(mentor?.availability) ? mentor.availability : [];
    return avail.map((s: string) => s.trim()).filter(Boolean);
  }, [mentor]);

  // Chuyển slot đã chọn thành scheduledAt (ngày gần nhất trong tương lai + giờ mặc định)
  function slotToScheduledAt(slot: string): string {
    const match = slot.match(/^(Thứ [2-7]|Chủ nhật)\s*-\s*(Sáng|Chiều|Tối)/);
    if (!match) return '';
    const dayName = match[1].trim();
    const period = match[2];
    const targetDay = vietnameseToDayNum[dayName];
    const hour = slotToHour[period] ?? 9;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      if (d.getDay() === targetDay) {
        d.setHours(hour, 0, 0, 0);
        if (d <= now) continue;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        return `${y}-${m}-${day}T${h}:00:00`;
      }
    }
    return '';
  }

  const mentorSubjects = (mentor?.subjects ?? []).filter(Boolean).length > 0
    ? (mentor?.subjects ?? []).filter(Boolean)
    : mentor?.subject
      ? [mentor.subject]
      : [];

  // === HANDLE: Send request to mentor (pending, mentor approves/rejects) ===
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor) return;

    const newErrors: Record<string, string> = {};
    if (!requestFormData.preferredSlot.trim()) newErrors.preferredSlot = 'Vui lòng chọn khung giờ';
    if (!requestFormData.topic.trim()) newErrors.topic = 'Vui lòng mô tả chủ đề';
    setRequestErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const scheduledAt = slotToScheduledAt(requestFormData.preferredSlot);
    if (!scheduledAt) {
      setRequestErrors({ preferredSlot: 'Không thể xác định thời gian từ khung giờ đã chọn' });
      return;
    }

    setRequestLoading(true);
    try {
      const token = getToken();
      if (!token) {
        router.push(`/login?redirect=/mentors/${mentor.id}`);
        return;
      }

      const res = await fetch('/api/mentor-bookings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mentorId: mentor.userId,
          type: requestFormData.type,
          amount: mentor.pricePerSession,
          scheduledAt,
          topic: requestFormData.topic.trim(),
          note: requestFormData.note.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRequestErrors({ topic: data.message || 'Gửi yêu cầu thất bại' });
        return;
      }

      setRequestSuccess(true);
    } catch {
      setRequestErrors({ topic: 'Có lỗi xảy ra. Vui lòng thử lại.' });
    } finally {
      setRequestLoading(false);
    }
  };

  // === HANDLE: Fetch user orders for this mentor ===
  const fetchOrders = async () => {
    const token = getToken();
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/mentor-bookings?role=student', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.data?.bookings) {
        const filtered = (data.data.bookings as BookingOrder[]).filter(
          (b) => b.mentorId === mentor?.userId
        );
        setOrders(filtered);
      }
    } catch { /* ignore */ }
    finally { setOrdersLoading(false); }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return '-'; }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 size={32} className="animate-spin text-slate-400" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-gray-600">Không tìm thấy mentor</p>
          <Link href="/mentors" className="mt-4 text-slate-600 hover:underline">
            Quay lại danh sách
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="px-4 py-8 mx-auto max-w-6xl sm:px-6 lg:px-8">
        <Link
          href="/mentors"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-slate-600 mb-6"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách Mentor
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left - Profile + Courses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mentor Profile Card */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row">
                {mentor.avatarUrl ? (
                  <Image
                    src={mentor.avatarUrl}
                    alt={mentor.fullName}
                    width={96}
                    height={96}
                    className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-2xl font-bold text-white">
                    {getInitials(mentor.fullName)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{mentor.fullName}</h1>
                  <p className="text-lg font-medium text-slate-600">{mentor.subject}</p>
                  {mentor.university && (
                    <p className="text-sm text-gray-500">{mentor.university}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4">
                    {mentor.rating > 0 && (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star size={18} className="fill-amber-500" />
                        {mentor.rating.toFixed(1)}
                        <span className="text-sm text-gray-500">
                          ({mentor.reviewCount} đánh giá)
                        </span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Users size={14} />
                      {mentor.menteeCount} mentee
                    </span>
                    <span className="text-sm text-gray-500">
                      {mentor.sessionCount} buổi
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {mentor.experience && (
                  <span className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                    <Clock size={14} />
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Số năm kinh nghiệm: {mentor.experience}
                  </p>
                  </span>
                )}
              </div>

              {/* Subjects */}
              {(mentor.subjects ?? []).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Chủ đề Mentoring
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(mentor.subjects ?? []).map((s) => (
                      <span key={s} className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Courses Section */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                  <BookOpen size={18} className="text-slate-600" />
                  Khóa học ({courses.length})
                </h3>
              </div>

              {courses.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Mentor chưa có khóa học nào.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {courses.map((course) => (
                    <div key={course.id} className="rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-800 line-clamp-1">{course.title}</h4>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          course.level === 'beginner' ? 'bg-green-100 text-green-700' :
                          course.level === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {levelLabels[course.level] || course.level}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{course.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="rounded bg-slate-100 px-2 py-0.5">{course.subject}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {course.duration}
                        </span>
                        {course.maxStudents && (
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            Tối đa {course.maxStudents} SV
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-lg font-bold text-slate-700">
                          {course.price > 0 ? formatPrice(course.price) : 'Miễn phí'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Availability */}
            {(Array.isArray(mentor.availability) ? mentor.availability : []).length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                  <Calendar size={18} className="text-slate-600" />
                  Lịch rảnh
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(Array.isArray(mentor.availability) ? mentor.availability : []).map((slot) => (
                    <span
                      key={slot}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
                  <Star size={18} className="text-amber-500" />
                  Đánh giá từ học viên ({reviews.length})
                </h3>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">{review.userName || 'Ẩn danh'}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-gray-200'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="p-6 space-y-3">
                  {/* Nói chuyện với Mentor - all logged-in users except this mentor */}
                  {canRequest && (
                    <button
                      onClick={() => {
                        const token = getToken();
                        if (!token) {
                          router.push(`/login?redirect=/mentors/${mentor.id}`);
                          return;
                        }
                        setShowRequestForm(true);
                        setRequestSuccess(false);
                        setRequestFormData({ preferredSlot: '', topic: '', note: '', type: 'consultation' });
                        setRequestErrors({});
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                    >
                      <MessageSquare size={18} />
                      Nói chuyện với Mentor
                    </button>
                  )}

                  {/* Quản lý đơn - all logged-in users except this mentor */}
                  {canRequest && (
                    <button
                      onClick={() => {
                        setShowOrders(true);
                        fetchOrders();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-700 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50"
                    >
                      <ClipboardList size={18} />
                      Quản lý đơn yêu cầu
                    </button>
                  )}

                  {/* Mentor's own actions */}
                  {isThisMentor && (
                    <Link
                      href="/mentor/dashboard"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                    >
                      <GraduationCap size={18} />
                      Vào Dashboard Mentor
                    </Link>
                  )}

                  {/* Not logged in */}
                  {!currentUser && (
                    <>
                      <Link
                        href={`/login?redirect=/mentors/${mentor.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                      >
                        <MessageSquare size={18} />
                        Đăng nhập để liên hệ Mentor
                      </Link>
                      <p className="text-center text-xs text-gray-500">
                        Đăng nhập để gửi yêu cầu nói chuyện với Mentor.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* VIP badge if user has VIP */}
              {currentUser?.vipPlan && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                  <p className="text-sm font-medium text-amber-700">
                    ⭐ Bạn đang là VIP — có thể được miễn phí hoặc giảm giá
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ===== MODAL: Nói chuyện với Mentor ===== */}
      {showRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare size={20} className="text-slate-600" />
                Gửi yêu cầu tới Mentor
              </h3>
              <button onClick={() => setShowRequestForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {requestSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
                <h3 className="font-semibold text-gray-800">Gửi yêu cầu thành công!</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Mentor sẽ xem xét yêu cầu của bạn. Nếu được chấp nhận, bạn sẽ được thanh toán.
                  Nếu bị từ chối, bạn sẽ nhận thông báo.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Bạn có thể theo dõi trạng thái đơn ở nút &quot;Quản lý đơn yêu cầu&quot;.
                </p>
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="mt-4 rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-4">
                <p className="text-sm text-gray-600 bg-slate-50 rounded-xl px-4 py-3">
                  Điền thông tin bên dưới để gửi yêu cầu. Mentor sẽ xem xét và phản hồi trong thời gian sớm nhất.
                </p>

                {/* Type */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Loại yêu cầu <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestFormData({ ...requestFormData, type: 'consultation' })}
                      className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                        requestFormData.type === 'consultation'
                          ? 'border-slate-700 bg-slate-50 text-slate-800'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      💬 Tư vấn
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestFormData({ ...requestFormData, type: 'session' })}
                      className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                        requestFormData.type === 'session'
                          ? 'border-slate-700 bg-slate-50 text-slate-800'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      📚 Học cùng
                    </button>
                  </div>
                </div>

                {/* Preferred slot */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Khung giờ mong muốn <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={requestFormData.preferredSlot}
                    onChange={(e) => setRequestFormData({ ...requestFormData, preferredSlot: e.target.value })}
                    className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                      requestErrors.preferredSlot ? 'border-red-300' : 'border-gray-200'
                    }`}
                  >
                    <option value="">
                      {availableSlots.length > 0 ? 'Chọn khung giờ' : 'Mentor chưa cập nhật lịch rảnh'}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {requestErrors.preferredSlot && (
                    <p className="mt-1 text-xs text-red-500">{requestErrors.preferredSlot}</p>
                  )}
                </div>

                {/* Topic */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    {requestFormData.type === 'session' ? 'Môn học / Chủ đề' : 'Nội dung cần tư vấn'} <span className="text-red-500">*</span>
                  </label>
                  {requestFormData.type === 'session' && mentorSubjects.length > 0 ? (
                    <select
                      value={requestFormData.topic}
                      onChange={(e) => setRequestFormData({ ...requestFormData, topic: e.target.value })}
                      className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                        requestErrors.topic ? 'border-red-300' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Chọn môn học</option>
                      {mentorSubjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <textarea
                      value={requestFormData.topic}
                      onChange={(e) => setRequestFormData({ ...requestFormData, topic: e.target.value })}
                      rows={3}
                      placeholder={
                        requestFormData.type === 'session'
                          ? 'Mô tả chủ đề, nội dung cần học...'
                          : 'VD: Định hướng nghề nghiệp, ôn thi học bổng, lộ trình học tập...'
                      }
                      className={`w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                        requestErrors.topic ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                  )}
                  {requestErrors.topic && (
                    <p className="mt-1 text-xs text-red-500">{requestErrors.topic}</p>
                  )}
                </div>

                {/* Note */}
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">Ghi chú thêm</label>
                  <input
                    type="text"
                    value={requestFormData.note}
                    onChange={(e) => setRequestFormData({ ...requestFormData, note: e.target.value })}
                    placeholder="Tùy chọn - Thêm thông tin cho Mentor"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>

                {/* Amount info */}
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Phí buổi {requestFormData.type === 'session' ? 'học' : 'tư vấn'}:</span>
                    <span className="font-bold">{formatPrice(mentor.pricePerSession)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Bạn sẽ thanh toán sau khi Mentor chấp nhận yêu cầu.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={requestLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-70"
                >
                  {requestLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={18} />
                      Gửi yêu cầu
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Hủy
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL: Quản lý đơn yêu cầu ===== */}
      {showOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList size={20} className="text-slate-600" />
                Đơn yêu cầu của bạn với {mentor.fullName}
              </h3>
              <button onClick={() => setShowOrders(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Bạn chưa gửi yêu cầu nào tới Mentor này</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-800">{order.topic || '—'}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {order.type === 'session' ? '📚 Học cùng' : '💬 Tư vấn'} • {formatDate(order.scheduledAt)}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{formatPrice(order.amount)}</span>
                      <span className="text-xs text-gray-400">Gửi: {formatDate(order.createdAt)}</span>
                    </div>

                    {/* Status-specific messages */}
                    {order.status === 'pending' && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <AlertCircle size={14} />
                        Đang chờ Mentor xem xét yêu cầu của bạn.
                      </div>
                    )}
                    {order.status === 'confirmed' && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                          <CheckCircle2 size={14} />
                          Mentor đã chấp nhận! Vui lòng thanh toán để hoàn tất.
                        </div>
                        <button
                          onClick={async () => {
                            const token = getToken();
                            if (!token) return;
                            try {
                              const res = await fetch(`/api/mentor-bookings/${order.id}/pay`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}` },
                              });
                              const data = await res.json();
                              if (data.data?.isFreeSession) {
                                alert('Buổi học miễn phí VIP đã được áp dụng!');
                                fetchOrders();
                                return;
                              }
                              if (data.data?.checkoutUrl) {
                                window.location.href = data.data.checkoutUrl;
                              }
                            } catch {
                              alert('Có lỗi xảy ra khi tạo thanh toán.');
                            }
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                        >
                          <DollarSign size={16} />
                          Thanh toán ngay
                        </button>
                      </div>
                    )}
                    {order.status === 'cancelled' && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                        <AlertCircle size={14} />
                        Đơn này đã bị từ chối hoặc đã hủy.
                      </div>
                    )}
                    {order.status === 'paid' && (
                      <div className="flex items-center gap-2 mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        <CheckCircle2 size={14} />
                        Đã thanh toán. Chờ Mentor xác nhận lịch hẹn.
                      </div>
                    )}
                    {order.status === 'completed' && (
                      <div className="flex items-center gap-2 mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <CheckCircle2 size={14} />
                        Buổi học đã hoàn thành.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
