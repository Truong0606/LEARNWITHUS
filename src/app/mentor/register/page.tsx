'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import {
  GraduationCap,
  CheckCircle2,
  Loader2,
  DollarSign,
  Clock,
  Users,
  Sparkles,
} from 'lucide-react';

const subjectOptions = [
  'Lập trình Web',
  'Toán rời rạc',
  'Trí tuệ nhân tạo',
  'Cơ sở dữ liệu',
  'IELTS',
  'Kinh tế học',
  'Vật lý',
  'Hóa học',
  'Khác',
];

const benefits = [
  { icon: DollarSign, text: 'Thu nhập từ mỗi buổi tư vấn' },
  { icon: Clock, text: 'Linh hoạt thời gian làm việc' },
  { icon: Users, text: 'Kết nối với sinh viên toàn quốc' },
];

export default function MentorRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    experience: '',
    availability: '',
    bio: '',
    pricePerSession: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.subject) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setSuccess(true);
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex flex-col items-center justify-center px-4 py-20">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Đăng ký thành công!</h2>
            <p className="mt-3 text-gray-600">
              Chúng tôi đã nhận đơn đăng ký của bạn. Đội ngũ sẽ xem xét và liên hệ trong 3-5 ngày làm việc.
            </p>
            <Link
              href="/mentors"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-all hover:bg-violet-700"
            >
              Xem danh sách Mentor
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="px-4 py-12 mx-auto max-w-5xl sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium text-violet-700 bg-violet-100 rounded-full">
            <Sparkles size={16} className="text-amber-500" />
            Trở thành Mentor
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-800 md:text-4xl">
            Đăng ký làm Mentor
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600">
            Chia sẻ kiến thức, hỗ trợ sinh viên và nhận thu nhập từ mỗi buổi tư vấn.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Benefits */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800">Lợi ích khi làm Mentor</h3>
              <ul className="mt-4 space-y-4">
                {benefits.map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                      <item.icon size={20} className="text-violet-600" />
                    </div>
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 p-6 text-white">
              <h3 className="font-semibold">Quy trình duyệt</h3>
              <ol className="mt-4 space-y-2 text-sm text-white/90">
                <li>1. Gửi đơn đăng ký</li>
                <li>2. Đội ngũ xem xét (3-5 ngày)</li>
                <li>3. Phỏng vấn ngắn (nếu cần)</li>
                <li>4. Kích hoạt tài khoản Mentor</li>
              </ol>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <h3 className="mb-6 font-semibold text-gray-800">Thông tin đăng ký</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="email@edu.vn"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-gray-700">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder="0912345678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Môn học / Lĩnh vực <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Chọn môn học</option>
                    {subjectOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Kinh nghiệm (năm)
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="VD: 5 năm"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Lịch rảnh (ước tính)
                  </label>
                  <input
                    type="text"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="VD: T2, T4, T6 tối 19h-21h"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Giá đề xuất / buổi (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.pricePerSession}
                    onChange={(e) => setFormData({ ...formData, pricePerSession: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="VD: 150000"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-700">
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Mô tả kinh nghiệm, chuyên môn, phong cách dạy..."
                  />
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <GraduationCap size={18} />
                    Gửi đơn đăng ký
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
