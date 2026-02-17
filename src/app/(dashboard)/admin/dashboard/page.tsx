'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader, StatsCard } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import { Users, FileText, Calendar, TestTube, MessageSquare } from 'lucide-react';

interface DashboardStats {
  users: number;
  blogs: number;
  bookings: number;
  tests: number;
  feedbacks: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    blogs: 0,
    bookings: 0,
    tests: 0,
    feedbacks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API call - replace with actual API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setStats({
          users: 156,
          blogs: 45,
          bookings: 234,
          tests: 189,
          feedbacks: 67,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter]);

  const filterButtons = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'week', label: 'Tuần này' },
    { key: 'month', label: 'Tháng này' },
    { key: 'year', label: 'Năm nay' },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="large" message="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="📊 Thống kê quản trị" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="👥 Người dùng"
            value={stats.users}
            icon={Users}
            color="purple"
          />
          <StatsCard
            title="📝 Bài viết"
            value={stats.blogs}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            title="📅 Lịch hẹn"
            value={stats.bookings}
            icon={Calendar}
            color="green"
          />
          <StatsCard
            title="🧪 Xét nghiệm"
            value={stats.tests}
            icon={TestTube}
            color="indigo"
          />
          <StatsCard
            title="💬 Phản hồi"
            value={stats.feedbacks}
            icon={MessageSquare}
            color="orange"
          />
        </div>

        {/* Chart Section */}
        <div className="p-6 bg-white shadow-xl rounded-2xl">
          <div className="flex flex-col justify-between mb-6 sm:flex-row sm:items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              📈 Hoạt động theo thời gian
            </h2>
            <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
              {filterButtons.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDateFilter(key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition duration-200 ${
                    dateFilter === key
                      ? 'bg-blue-500 text-white shadow'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Placeholder for chart - in production, use recharts */}
          <div className="flex items-center justify-center bg-gray-100 rounded-lg h-96">
            <div className="text-center">
              <p className="text-gray-500">
                Biểu đồ thống kê hoạt động
              </p>
              <p className="mt-2 text-sm text-gray-400">
                (Tích hợp Recharts cho biểu đồ chi tiết)
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
          {/* Recent Users */}
          <div className="p-6 bg-white shadow-lg rounded-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Người dùng mới
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <Users size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        Nguyễn Văn {String.fromCharCode(64 + i)}
                      </p>
                      <p className="text-sm text-gray-500">
                        user{i}@example.com
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    Mới
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="p-6 bg-white shadow-lg rounded-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Lịch hẹn gần đây
            </h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                      <Calendar size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        Xét nghiệm ADN #{1000 + i}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      i % 3 === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : i % 3 === 1
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {i % 3 === 0 ? 'Chờ xử lý' : i % 3 === 1 ? 'Đang xử lý' : 'Hoàn thành'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

