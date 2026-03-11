'use client';

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import {
  RefreshCcw,
  TrendingUp,
  Crown,
  GraduationCap,
  MessageSquare,
  Calendar,
  FlaskConical,
  Percent,
} from 'lucide-react';
import type { RevenueSourceType } from '@/types';

interface RevenueData {
  summary: { total: number; byType: Record<RevenueSourceType, number> };
  items: {
    id: string;
    sourceType: RevenueSourceType;
    amount: number;
    paidAt: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }[];
  labels: Record<RevenueSourceType, string>;
}

const ICON_MAP: Record<RevenueSourceType, typeof Crown> = {
  vip_upgrade: Crown,
  mentor_upgrade: GraduationCap,
  mentor_session: GraduationCap,
  mentor_consultation: MessageSquare,
  test_booking: FlaskConical,
};

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (typeFilter) params.set('type', typeFilter);

      const res = await fetch(`/api/admin/revenue?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login';
        return;
      }
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [typeFilter]);

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

  const sourceTypes: RevenueSourceType[] = [
    'vip_upgrade',
    'mentor_upgrade',
    'mentor_session',
    'mentor_consultation',
    'test_booking',
  ];

  return (
    <div className="p-6">
      <DashboardHeader title="Quản lý doanh thu" />
      <div className="mt-6 flex flex-wrap items-center gap-4">
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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
        >
          <option value="">Tất cả loại</option>
          {sourceTypes.map((t) => (
            <option key={t} value={t}>
              {data?.labels?.[t] ?? t}
            </option>
          ))}
        </select>
        <button
          onClick={() => fetchRevenue()}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <RefreshCcw size={16} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                  <TrendingUp size={24} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng doanh thu</p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatPrice(data.summary.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Platform fee 20% from mentor sessions */}
            {(() => {
              const mentorRevenue = (data.summary.byType['mentor_session'] ?? 0) + (data.summary.byType['mentor_consultation'] ?? 0);
              const platformFee = Math.round(mentorRevenue * 0.2);
              const mentorShare = mentorRevenue - platformFee;
              return (
                <>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                        <Percent size={24} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phí nền tảng 20%</p>
                        <p className="text-xl font-bold text-emerald-700">
                          {formatPrice(platformFee)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Từ {formatPrice(mentorRevenue)} doanh thu mentor
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                        <GraduationCap size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mentor nhận (80%)</p>
                        <p className="text-xl font-bold text-gray-800">
                          {formatPrice(mentorShare)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Revenue by type */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {sourceTypes.map((t) => {
              const Icon = ICON_MAP[t];
              const amount = data.summary.byType[t] ?? 0;
              return (
                <div
                  key={t}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                      <Icon size={20} className="text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-gray-500">
                        {data.labels[t]}
                      </p>
                      <p className="text-sm font-bold text-gray-800">
                        {formatPrice(amount)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transaction list */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Chi tiết giao dịch
              </h3>
            </div>
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Loại
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Số tiền
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Phí NTT (20%)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Mentor (80%)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Mô tả
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Ngày thanh toán
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Chưa có giao dịch nào trong khoảng thời gian đã chọn
                    </td>
                  </tr>
                ) : (
                  data.items.map((item) => {
                    const Icon = ICON_MAP[item.sourceType];
                    const isMentorType = item.sourceType === 'mentor_session' || item.sourceType === 'mentor_consultation';
                    const platformFee = isMentorType ? Math.round(item.amount * 0.2) : 0;
                    const mentorShare = isMentorType ? item.amount - platformFee : 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                              <Icon size={16} className="text-violet-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-800">
                              {data.labels[item.sourceType]}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-emerald-600">
                          {formatPrice(item.amount)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-emerald-700">
                          {isMentorType ? formatPrice(platformFee) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {isMentorType ? formatPrice(mentorShare) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.description || (item.metadata?.description as string) || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(item.paidAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Không thể tải dữ liệu doanh thu
        </div>
      )}
    </div>
  );
}
