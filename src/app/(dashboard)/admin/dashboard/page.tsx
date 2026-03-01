'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardHeader, StatsCard } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import {
  Users,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Timer,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  users: number;
  groups: number;
  posts: number;
  mentorRequests: number;
  activeSessions: number;
}

// Mock chart data - Sinh viên mới & Bài viết mới
const chartData = [
  { name: 'T1', newUsers: 42, newPosts: 28 },
  { name: 'T2', newUsers: 55, newPosts: 35 },
  { name: 'T3', newUsers: 48, newPosts: 41 },
  { name: 'T4', newUsers: 62, newPosts: 38 },
  { name: 'T5', newUsers: 71, newPosts: 52 },
  { name: 'T6', newUsers: 58, newPosts: 61 },
  { name: 'T7', newUsers: 68, newPosts: 55 },
  { name: 'T8', newUsers: 82, newPosts: 67 },
  { name: 'T9', newUsers: 75, newPosts: 72 },
  { name: 'T10', newUsers: 89, newPosts: 78 },
];

// Mock sinh viên mới đăng ký
const mockNewUsers = [
  { id: 1, name: 'Nguyễn Văn An', email: 'an.nguyen@edu.vn', university: 'ĐH Bách Khoa' },
  { id: 2, name: 'Trần Thị Bình', email: 'binh.tran@edu.vn', university: 'ĐH Khoa học Tự nhiên' },
  { id: 3, name: 'Lê Văn Cường', email: 'cuong.le@edu.vn', university: 'ĐH Kinh tế' },
  { id: 4, name: 'Phạm Thị Dung', email: 'dung.pham@edu.vn', university: 'ĐH Sư phạm' },
  { id: 5, name: 'Hoàng Văn Em', email: 'em.hoang@edu.vn', university: 'ĐH Công nghệ' },
];

// Mock bài viết mới trên cộng đồng
const mockRecentPosts = [
  { id: 'p1', title: 'Cách ôn thi Toán rời rạc hiệu quả', group: 'Toán rời rạc', likes: 24 },
  { id: 'p2', title: 'Chia sẻ tài liệu React cho dự án cuối kỳ', group: 'Lập trình Web', likes: 18 },
  { id: 'p3', title: 'Hỏi về thuật toán Dijkstra', group: 'Cấu trúc dữ liệu', likes: 12 },
  { id: 'p4', title: 'Lịch học nhóm IELTS tuần này', group: 'IELTS', likes: 8 },
  { id: 'p5', title: 'Tài liệu ôn AI - Machine Learning', group: 'Trí tuệ nhân tạo', likes: 31 },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    groups: 0,
    posts: 0,
    mentorRequests: 0,
    activeSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStats({
          users: 1256,
          groups: 48,
          posts: 892,
          mentorRequests: 23,
          activeSessions: 67,
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
    { key: 'today' as const, label: 'Hôm nay' },
    { key: 'week' as const, label: 'Tuần này' },
    { key: 'month' as const, label: 'Tháng này' },
    { key: 'year' as const, label: 'Năm nay' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loading size="large" message="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="Tổng quan" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Sinh viên"
            value={stats.users}
            icon={Users}
            color="purple"
            change="+12%"
            changeType="increase"
          />
          <StatsCard
            title="Nhóm học"
            value={stats.groups}
            icon={BookOpen}
            color="blue"
            change="+5%"
            changeType="increase"
          />
          <StatsCard
            title="Bài viết"
            value={stats.posts}
            icon={MessageSquare}
            color="green"
            change="+18%"
            changeType="increase"
          />
          <StatsCard
            title="Yêu cầu Mentor"
            value={stats.mentorRequests}
            icon={GraduationCap}
            color="indigo"
            change="+8%"
            changeType="increase"
          />
          <StatsCard
            title="Pomodoro đang chạy"
            value={stats.activeSessions}
            icon={Timer}
            color="orange"
          />
        </div>

        {/* Chart Section */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                <TrendingUp size={20} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Hoạt động cộng đồng
                </h2>
                <p className="text-sm text-gray-500">
                  Sinh viên mới đăng ký và bài viết mới trên diễn đàn
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
              {filterButtons.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDateFilter(key)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    dateFilter === key
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNewPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: '#64748b' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="#8b5cf6"
                    fillOpacity={0.2}
                    name="Sinh viên mới"
                  />
                  <Area
                    type="monotone"
                    dataKey="newPosts"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="#10b981"
                    fillOpacity={0.2}
                    name="Bài viết mới"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-6 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-violet-500" />
                <span className="text-sm text-gray-600">Sinh viên mới đăng ký</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600">Bài viết mới</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sinh viên mới đăng ký */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Sinh viên mới đăng ký
              </h3>
              <Link
                href="/admin/users"
                className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
              >
                Xem tất cả
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {mockNewUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50/80"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">
                        {user.email} • {user.university}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Mới
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bài viết mới trên cộng đồng */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Bài viết mới trên cộng đồng
              </h3>
              <Link
                href="/community"
                className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
              >
                Xem diễn đàn
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {mockRecentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50/80"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                      <MessageSquare size={20} className="text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-800">{post.title}</p>
                      <p className="text-sm text-gray-500">
                        #{post.group} • {post.likes} lượt thích
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
              <ArrowUpRight size={24} className="text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">+24</p>
              <p className="text-sm text-gray-500">Đăng ký hôm nay</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <MessageSquare size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">+18</p>
              <p className="text-sm text-gray-500">Bài viết hôm nay</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <GraduationCap size={24} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">5</p>
              <p className="text-sm text-gray-500">Yêu cầu mentor chờ</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100">
              <Timer size={24} className="text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">67</p>
              <p className="text-sm text-gray-500">Đang học Pomodoro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
