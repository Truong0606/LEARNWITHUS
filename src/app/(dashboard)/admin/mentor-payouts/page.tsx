'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import { CheckCircle, Clock, DollarSign, RefreshCcw, Filter, Users } from 'lucide-react';

interface PayoutItem {
  bookingId: string;
  mentorId: string;
  mentorName: string;
  userId: string;
  userName: string;
  topic: string;
  type: string;
  amount: number;
  mentorAmount: number;
  scheduledAt: string;
  completedAt?: string;
  mentorPaid: boolean;
  mentorPaidAt?: string;
  isFreeVipSession: boolean;
}

interface MentorSummary {
  mentorId: string;
  mentorName: string;
  totalOwed: number;
  totalPaid: number;
  pendingItems: number;
}

export default function AdminMentorPayoutsPage() {
  const [items, setItems] = useState<PayoutItem[]>([]);
  const [byMentor, setByMentor] = useState<Record<string, MentorSummary>>({});
  const [summary, setSummary] = useState({ totalOwed: 0, totalPaid: 0 });
  const [loading, setLoading] = useState(true);
  const [paidFilter, setPaidFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [payingLoading, setPayingLoading] = useState(false);
  const [view, setView] = useState<'table' | 'summary'>('summary');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const formatDate = (s?: string) => {
    if (!s) return '-';
    try { return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return '-'; }
  };

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) { window.location.href = '/login'; return; }
      const params = new URLSearchParams();
      if (paidFilter === 'pending') params.set('paid', 'false');
      else if (paidFilter === 'paid') params.set('paid', 'true');
      if (selectedMentorId) params.set('mentorId', selectedMentorId);
      const res = await fetch(`/api/admin/mentor-payouts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) { window.location.href = '/login'; return; }
      const data = await res.json();
      if (data.data) {
        setItems(data.data.items || []);
        setByMentor(data.data.byMentor || {});
        setSummary(data.data.summary || { totalOwed: 0, totalPaid: 0 });
      }
    } catch {}
    finally { setLoading(false); }
  }, [paidFilter, selectedMentorId]);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleSelectAll = () => {
    const pendingIds = items.filter((i) => !i.mentorPaid).map((i) => i.bookingId);
    if (selected.size === pendingIds.length && pendingIds.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingIds));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkPay = async () => {
    if (selected.size === 0) { alert('Vui lòng chọn ít nhất 1 đơn'); return; }
    if (!confirm(`Xác nhận đã thanh toán cho ${selected.size} đơn Mentor?`)) return;
    const token = getToken();
    if (!token) return;
    setPayingLoading(true);
    try {
      const res = await fetch('/api/admin/mentor-payouts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Đã xác nhận thanh toán');
        setSelected(new Set());
        fetchPayouts();
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch { alert('Có lỗi xảy ra'); }
    finally { setPayingLoading(false); }
  };

  const pendingItems = items.filter((i) => !i.mentorPaid);

  if (loading) return <Loading />;

  return (
    <div className="p-6">
      <DashboardHeader title="Thanh toán Mentor" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 mb-3">
            <Clock size={20} className="text-amber-600" />
          </div>
          <p className="text-xl font-bold text-gray-800">{formatPrice(summary.totalOwed)}</p>
          <p className="text-sm text-gray-500">Cần thanh toán</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 mb-3">
            <CheckCircle size={20} className="text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-gray-800">{formatPrice(summary.totalPaid)}</p>
          <p className="text-sm text-gray-500">Đã thanh toán</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 mb-3">
            <DollarSign size={20} className="text-blue-600" />
          </div>
          <p className="text-xl font-bold text-gray-800">{pendingItems.length}</p>
          <p className="text-sm text-gray-500">Đơn chờ thanh toán</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 mb-3">
            <Users size={20} className="text-violet-600" />
          </div>
          <p className="text-xl font-bold text-gray-800">{Object.keys(byMentor).length}</p>
          <p className="text-sm text-gray-500">Mentor có đơn</p>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
            {(['summary', 'table'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 font-medium transition-colors ${view === v ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {v === 'summary' ? 'Tổng hợp' : 'Chi tiết'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
            <Filter size={14} className="text-gray-400" />
            <select
              value={paidFilter}
              onChange={(e) => setPaidFilter(e.target.value as typeof paidFilter)}
              className="bg-transparent text-gray-700 focus:outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
            </select>
          </div>
          <button onClick={fetchPayouts} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <RefreshCcw size={14} /> Làm mới
          </button>
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleBulkPay}
            disabled={payingLoading}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle size={16} />
            {payingLoading ? 'Đang xử lý...' : `Xác nhận thanh toán (${selected.size})`}
          </button>
        )}
      </div>

      {/* Summary View */}
      {view === 'summary' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(byMentor).map((mentor) => (
            <div key={mentor.mentorId} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{mentor.mentorName || '—'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{mentor.mentorId.slice(-8)}</p>
                </div>
                {mentor.pendingItems > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {mentor.pendingItems} chờ TT
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Chờ thanh toán</span>
                  <span className="font-semibold text-amber-600">{formatPrice(mentor.totalOwed)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Đã thanh toán</span>
                  <span className="font-semibold text-emerald-600">{formatPrice(mentor.totalPaid)}</span>
                </div>
              </div>
              {mentor.pendingItems > 0 && (
                <button
                  onClick={() => {
                    setSelectedMentorId(mentor.mentorId);
                    setPaidFilter('pending');
                    setView('table');
                  }}
                  className="mt-4 w-full rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  Xem {mentor.pendingItems} đơn chờ
                </button>
              )}
            </div>
          ))}
          {Object.keys(byMentor).length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              Không có dữ liệu thanh toán
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Chi tiết đơn ({items.length})</h3>
            {paidFilter !== 'paid' && items.filter((i) => !i.mentorPaid).length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-slate-600 hover:text-slate-800 font-medium"
              >
                {selected.size === pendingItems.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả chờ TT'}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-10">
                    <span className="sr-only">Chọn</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Mentor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Học viên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Chủ đề</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Ngày HT</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Học viên TT</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Mentor nhận (80%)</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.bookingId} className={`hover:bg-gray-50/50 ${selected.has(item.bookingId) ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      {!item.mentorPaid && (
                        <input
                          type="checkbox"
                          checked={selected.has(item.bookingId)}
                          onChange={() => handleToggleSelect(item.bookingId)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.mentorName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.userName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{item.topic}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.completedAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right">{formatPrice(item.amount)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600 text-right">{formatPrice(item.mentorAmount)}</td>
                    <td className="px-4 py-3 text-center">
                      {item.mentorPaid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle size={12} /> Đã TT {item.mentorPaidAt ? formatDate(item.mentorPaidAt) : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <Clock size={12} /> Chờ TT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 text-sm">
                      Không có đơn nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
