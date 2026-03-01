'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader, StatsCard } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import { FileText, Calendar, MessageSquare, CreditCard } from 'lucide-react';

interface DashboardStats {
  blogs: number;
  bookings: number;
  feedbacks: number;
  payments: number;
}

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    blogs: 0,
    bookings: 0,
    feedbacks: 0,
    payments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setStats({
          blogs: 32,
          bookings: 156,
          feedbacks: 45,
          payments: 89,
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
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <Loading size="large" message="Đang tải dữ liệu thống kê..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-auto bg-blue-50">
      <DashboardHeader title="Thống kê tổng quan" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Bài viết"
            value={stats.blogs}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            title="Lịch xét nghiệm"
            value={stats.bookings}
            icon={Calendar}
            color="green"
          />
          <StatsCard
            title="Phản hồi"
            value={stats.feedbacks}
            icon={MessageSquare}
            color="orange"
          />
          <StatsCard
            title="Thanh toán"
            value={stats.payments}
            icon={CreditCard}
            color="red"
          />
        </div>

        {/* Chart Section */}
        <div className="p-6 bg-white shadow-xl rounded-2xl">
          <div className="flex flex-col justify-between mb-6 sm:flex-row sm:items-center">
            <h2 className="text-xl font-semibold text-gray-700"></h2>
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

          <h3 className="mb-4 text-lg font-medium text-gray-800">
            📈 Hoạt động theo thời gian
          </h3>

          {/* Chart Placeholder */}
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

        {/* Recent Activity Tables */}
        <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
          {/* Recent Bookings */}
          <div className="p-6 bg-white shadow-lg rounded-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Đơn xét nghiệm gần đây
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-3 text-sm font-medium text-gray-500">Mã đơn</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Khách hàng</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-3 text-sm font-medium text-blue-600">
                        #BK{1000 + i}
                      </td>
                      <td className="py-3 text-sm text-gray-700">
                        Nguyễn Văn {String.fromCharCode(64 + i)}
                      </td>
                      <td className="py-3">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="p-6 bg-white shadow-lg rounded-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Thanh toán gần đây
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-3 text-sm font-medium text-gray-500">Mã GD</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Số tiền</th>
                    <th className="pb-3 text-sm font-medium text-gray-500">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-3 text-sm font-medium text-gray-700">
                        #PM{2000 + i}
                      </td>
                      <td className="py-3 text-sm text-gray-700">
                        {(3500000 + i * 500000).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            i % 2 === 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {i % 2 === 0 ? 'Đã thanh toán' : 'Đã đặt cọc'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

