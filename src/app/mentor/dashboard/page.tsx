'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import {
  Calendar,
  DollarSign,
  Star,
  Users,
  Clock,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

// Mock data for mentor dashboard
const mockUpcomingSessions = [
  { id: 1, student: 'Nguyễn Văn A', subject: 'Toán rời rạc - Chương 4', date: '01/03/2025', time: '19:00' },
  { id: 2, student: 'Trần Thị B', subject: 'React - State management', date: '02/03/2025', time: '14:00' },
  { id: 3, student: 'Lê Văn C', subject: 'IELTS Writing Task 2', date: '03/03/2025', time: '20:00' },
];

const mockPendingRequests = [
  { id: 1, student: 'Phạm Thị D', topic: 'Ôn thi AI - Neural Network', preferredDate: '04/03/2025' },
  { id: 2, student: 'Hoàng Văn E', topic: 'SQL - Query tối ưu', preferredDate: '05/03/2025' },
];

export default function MentorDashboardPage() {
  const [stats] = useState({
    totalSessions: 156,
    totalEarnings: 23400000,
    rating: 4.9,
    pendingRequests: 2,
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="px-4 py-8 mx-auto max-w-6xl sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Mentor</h1>
          <p className="mt-1 text-gray-600">Quản lý lịch tư vấn và thu nhập</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
              <Calendar size={24} className="text-violet-600" />
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-800">{stats.totalSessions}</p>
            <p className="text-sm text-gray-500">Tổng buổi tư vấn</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <DollarSign size={24} className="text-emerald-600" />
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-800">
              {formatPrice(stats.totalEarnings)}
            </p>
            <p className="text-sm text-gray-500">Tổng thu nhập</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Star size={24} className="text-amber-600" />
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-800">{stats.rating}</p>
            <p className="text-sm text-gray-500">Đánh giá trung bình</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100">
              <MessageSquare size={24} className="text-cyan-600" />
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-800">{stats.pendingRequests}</p>
            <p className="text-sm text-gray-500">Yêu cầu chờ xác nhận</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Sessions */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold text-gray-800">Lịch tư vấn sắp tới</h3>
              <Link
                href="#"
                className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
              >
                Xem tất cả
                <ChevronRight size={16} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {mockUpcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
                      <Users size={20} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{session.student}</p>
                      <p className="text-sm text-gray-500">{session.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {session.date} • {session.time}
                    </p>
                    <p className="text-xs text-gray-500">45 phút</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Requests */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold text-gray-800">Yêu cầu chờ xác nhận</h3>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                {mockPendingRequests.length} mới
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {mockPendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/80 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800">{req.student}</p>
                    <p className="text-sm text-gray-500">{req.topic}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Mong muốn: {req.preferredDate}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200">
                      Xác nhận
                    </button>
                    <button className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200">
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800">Thông tin thanh toán</h3>
          <p className="mt-2 text-sm text-gray-600">
            Thu nhập được chuyển vào tài khoản ngân hàng đã đăng ký vào cuối mỗi tháng.
            Platform thu phí dịch vụ 20%, Mentor nhận 80% giá mỗi buổi.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-violet-600">
            <Clock size={16} />
            Liên hệ admin nếu cần hỗ trợ
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
