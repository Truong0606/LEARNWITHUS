'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';

// Mock mentor detail
const getMentorById = (id: string) => {
  const mentors: Record<string, {
    id: string;
    name: string;
    subject: string;
    university: string;
    rating: number;
    reviewCount: number;
    sessionCount: number;
    pricePerSession: number;
    avatar: string;
    bio: string;
    experience: string;
    availability: string[];
  }> = {
    m1: {
      id: 'm1',
      name: 'Nguyễn Minh Tuấn',
      subject: 'Lập trình Web',
      university: 'ĐH Bách Khoa HN',
      rating: 4.9,
      reviewCount: 48,
      sessionCount: 156,
      pricePerSession: 150000,
      avatar: 'NT',
      bio: '5 năm kinh nghiệm phát triển web. Chuyên React, Node.js, TypeScript. Từng làm việc tại các startup công nghệ và hiện đang giảng dạy tại trường.',
      experience: '5 năm',
      availability: ['T2 19:00-21:00', 'T4 19:00-21:00', 'T6 14:00-17:00', 'CN 9:00-12:00'],
    },
    m2: {
      id: 'm2',
      name: 'Trần Thị Hương',
      subject: 'Toán rời rạc',
      university: 'ĐH Khoa học Tự nhiên',
      rating: 4.8,
      reviewCount: 32,
      sessionCount: 98,
      pricePerSession: 120000,
      avatar: 'TH',
      bio: 'Thạc sĩ Toán học. Chuyên ôn thi cuối kỳ, luyện tư duy logic và giải bài tập.',
      experience: '7 năm',
      availability: ['T3 18:00-20:00', 'T5 18:00-20:00', 'T7 9:00-11:00'],
    },
    m3: {
      id: 'm3',
      name: 'Lê Văn Đức',
      subject: 'Trí tuệ nhân tạo',
      university: 'ĐH Công nghệ',
      rating: 5.0,
      reviewCount: 24,
      sessionCount: 67,
      pricePerSession: 200000,
      avatar: 'ĐL',
      bio: 'Nghiên cứu sinh AI. Hướng dẫn Machine Learning, Deep Learning, Python.',
      experience: '4 năm',
      availability: ['T2 14:00-17:00', 'T4 14:00-17:00', 'T6 19:00-21:00'],
    },
    m4: {
      id: 'm4',
      name: 'Phạm Thu Hà',
      subject: 'IELTS',
      university: 'ĐH Ngoại ngữ',
      rating: 4.7,
      reviewCount: 56,
      sessionCount: 189,
      pricePerSession: 180000,
      avatar: 'HP',
      bio: 'IELTS 8.5. Chuyên Writing & Speaking. Luyện thi cấp tốc.',
      experience: '6 năm',
      availability: ['T3 19:00-21:00', 'T5 19:00-21:00', 'CN 14:00-17:00'],
    },
    m5: {
      id: 'm5',
      name: 'Hoàng Minh Quân',
      subject: 'Cơ sở dữ liệu',
      university: 'ĐH Bách Khoa',
      rating: 4.9,
      reviewCount: 41,
      sessionCount: 112,
      pricePerSession: 130000,
      avatar: 'QH',
      bio: 'DBA 3 năm. SQL, MongoDB, thiết kế database, tối ưu truy vấn.',
      experience: '5 năm',
      availability: ['T2 18:00-20:00', 'T4 18:00-20:00', 'T6 9:00-12:00'],
    },
  };
  return mentors[id] ?? null;
};

export default function MentorDetailPage() {
  const params = useParams();
  const mentorId = typeof params.id === 'string' ? params.id : params.id?.[0];
  const mentor = mentorId ? getMentorById(mentorId) : null;

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    topic: '',
    note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.preferredDate) newErrors.preferredDate = 'Vui lòng chọn ngày';
    if (!formData.preferredTime) newErrors.preferredTime = 'Vui lòng chọn khung giờ';
    if (!formData.topic.trim()) newErrors.topic = 'Vui lòng mô tả chủ đề cần tư vấn';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      setBookingSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (!mentor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-gray-600">Không tìm thấy mentor</p>
          <Link href="/mentors" className="mt-4 text-violet-600 hover:underline">
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
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-violet-600 mb-6"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách Mentor
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left - Profile */}
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-2xl font-bold text-white">
                  {mentor.avatar}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{mentor.name}</h1>
                  <p className="text-lg font-medium text-violet-600">{mentor.subject}</p>
                  <p className="text-sm text-gray-500">{mentor.university}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star size={18} className="fill-amber-500" />
                      {mentor.rating}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({mentor.reviewCount} đánh giá • {mentor.sessionCount} buổi)
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-gray-600">{mentor.bio}</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <span className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700">
                  <Clock size={14} />
                  Kinh nghiệm: {mentor.experience}
                </span>
              </div>
            </div>

            {/* Availability */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-semibold text-gray-800">
                <Calendar size={18} className="text-violet-600" />
                Lịch rảnh
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {mentor.availability.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700"
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6">
                <p className="text-2xl font-bold text-violet-600">
                  {formatPrice(mentor.pricePerSession)}
                </p>
                <p className="text-sm text-gray-500">/ buổi tư vấn (45 phút)</p>
              </div>

              {bookingSuccess ? (
                <div className="p-6 text-center">
                  <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
                  <h3 className="font-semibold text-gray-800">Đặt lịch thành công!</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Chúng tôi đã gửi email xác nhận. Mentor sẽ liên hệ trong 24h.
                  </p>
                  <button
                    onClick={() => {
                      setBookingSuccess(false);
                      setShowBookingForm(false);
                      setFormData({ preferredDate: '', preferredTime: '', topic: '', note: '' });
                    }}
                    className="mt-4 text-sm font-medium text-violet-600 hover:underline"
                  >
                    Đặt lịch khác
                  </button>
                </div>
              ) : showBookingForm ? (
                <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Ngày hẹn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) =>
                        setFormData({ ...formData, preferredDate: e.target.value })
                      }
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                        errors.preferredDate ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    {errors.preferredDate && (
                      <p className="mt-1 text-xs text-red-500">{errors.preferredDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Khung giờ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.preferredTime}
                      onChange={(e) =>
                        setFormData({ ...formData, preferredTime: e.target.value })
                      }
                      className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                        errors.preferredTime ? 'border-red-300' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Chọn khung giờ</option>
                      <option value="09:00-10:00">09:00 - 10:00</option>
                      <option value="10:00-11:00">10:00 - 11:00</option>
                      <option value="14:00-15:00">14:00 - 15:00</option>
                      <option value="15:00-16:00">15:00 - 16:00</option>
                      <option value="19:00-20:00">19:00 - 20:00</option>
                      <option value="20:00-21:00">20:00 - 21:00</option>
                    </select>
                    {errors.preferredTime && (
                      <p className="mt-1 text-xs text-red-500">{errors.preferredTime}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Chủ đề cần tư vấn <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      rows={3}
                      placeholder="VD: Ôn thi chương 4 Toán rời rạc, bài tập đồ thị..."
                      className={`w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                        errors.topic ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    {errors.topic && (
                      <p className="mt-1 text-xs text-red-500">{errors.topic}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Ghi chú thêm
                    </label>
                    <input
                      type="text"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Tùy chọn"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Calendar size={18} />
                        Xác nhận đặt lịch
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Thanh toán qua email xác nhận. Hủy trước 24h được hoàn tiền.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="w-full text-sm text-gray-500 hover:text-gray-700"
                  >
                    Hủy
                  </button>
                </form>
              ) : (
                <div className="p-6">
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
                  >
                    <Calendar size={18} />
                    Đặt lịch tư vấn
                  </button>
                  <p className="mt-4 text-center text-xs text-gray-500">
                    Đăng nhập để đặt lịch. VIP được 2 buổi miễn phí/tháng.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
