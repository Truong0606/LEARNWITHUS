'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import {
  Search,
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
  Star,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X,
  ClipboardList,
  Users as UsersIcon,
} from 'lucide-react';

interface MentorProfileDto {
  id: string;
  userId: string;
  fullName: string;
  title?: string;
  subject: string;
  subjects: string[];
  experience?: string;
  pricePerSession?: number;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  bio?: string;
  company?: string;
  university?: string;
  availability?: string[];
  bankName?: string;
  bankAccountNumber?: string;
  createdAt?: string;
  avatarUrl?: string;
}

interface MentorRequestDto {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  experience?: string;
  availability?: string;
  pricePerSession?: number;
  bio?: string;
  goal: string;
  bankName?: string;
  bankAccountNumber?: string;
  status: string;
  createdAt: string;
}

type MentorTab = 'list' | 'requests';

export default function AdminMentorsPage() {
  const [activeTab, setActiveTab] = useState<MentorTab>('list');

  // ─── Mentor List State ─────────────────
  const [mentors, setMentors] = useState<MentorProfileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MentorProfileDto>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // ─── Mentor Requests State ─────────────
  const [requests, setRequests] = useState<MentorRequestDto[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const formatPrice = (n?: number) =>
    n ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n) : '—';

  const formatDate = (s: string) => {
    if (!s) return '-';
    try { return new Date(s).toLocaleDateString('vi-VN'); } catch { return s; }
  };

  // ─── Fetch Mentors ─────────────────────
  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      const params = new URLSearchParams();
      if (filterActive === 'active') params.set('isActive', 'true');
      if (filterActive === 'inactive') params.set('isActive', 'false');
      const res = await fetch(`/api/admin/mentors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data.data)) setMentors(data.data);
    } catch {}
    finally { setLoading(false); }
  }, [filterActive]);

  // ─── Fetch Requests ────────────────────
  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const token = getToken();
      if (!token) return;
      const url = statusFilter
        ? `/api/admin/mentor-requests?status=${encodeURIComponent(statusFilter)}`
        : '/api/admin/mentor-requests';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data) setRequests(data.data as MentorRequestDto[]);
    } catch {}
    finally { setRequestsLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);
  useEffect(() => { if (activeTab === 'requests') fetchRequests(); }, [activeTab, fetchRequests]);

  const handleToggleActive = async (mentor: MentorProfileDto) => {
    const token = getToken();
    if (!token) return;
    setToggleLoading(mentor.id);
    try {
      const res = await fetch(`/api/admin/mentors/${mentor.id}/toggle-active`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMentors((prev) =>
          prev.map((m) => m.id === mentor.id ? { ...m, isActive: data.data.isActive } : m)
        );
      } else {
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch { alert('Có lỗi xảy ra'); }
    finally { setToggleLoading(null); }
  };

  const startEdit = (mentor: MentorProfileDto) => {
    setEditingId(mentor.id);
    setEditForm({
      fullName: mentor.fullName,
      title: mentor.title || '',
      subject: mentor.subject,
      experience: mentor.experience || '',
      pricePerSession: mentor.pricePerSession,
      bio: mentor.bio || '',
      company: mentor.company || '',
      university: mentor.university || '',
      bankName: mentor.bankName || '',
      bankAccountNumber: mentor.bankAccountNumber || '',
    });
    setSaveMsg('');
  };

  const handleSave = async () => {
    if (!editingId) return;
    const token = getToken();
    if (!token) return;
    setSaveLoading(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/admin/mentors', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: editingId, ...editForm }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg('Đã lưu thành công!');
        setMentors((prev) =>
          prev.map((m) => m.id === editingId ? { ...m, ...editForm } : m)
        );
        setTimeout(() => { setEditingId(null); setSaveMsg(''); }, 1500);
      } else {
        setSaveMsg(data.message || 'Có lỗi xảy ra');
      }
    } catch { setSaveMsg('Có lỗi xảy ra'); }
    finally { setSaveLoading(false); }
  };

  const handleApprove = async (id: string) => {
    const token = getToken();
    if (!token) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/mentor-requests/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { fetchRequests(); fetchMentors(); }
      else { alert(data.message || 'Có lỗi xảy ra'); }
    } catch { alert('Có lỗi xảy ra'); }
    finally { setActionLoading(null); }
  };

  const handleDeny = async (id: string) => {
    if (!confirm('Bạn có chắc muốn từ chối yêu cầu này?')) return;
    const token = getToken();
    if (!token) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/mentor-requests/${id}/deny`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { fetchRequests(); }
      else { alert(data.message || 'Có lỗi xảy ra'); }
    } catch { alert('Có lỗi xảy ra'); }
    finally { setActionLoading(null); }
  };

  const filtered = mentors.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.title?.toLowerCase().includes(q) ||
      m.company?.toLowerCase().includes(q)
    );
  });

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-6">
      <DashboardHeader title="Quản lý Mentor" />

      {/* Tabs */}
      <div className="mt-4 flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <UsersIcon size={16} />
          Danh sách Mentor
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'requests' ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ClipboardList size={16} />
          Yêu cầu đăng ký
          {pendingRequestsCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded-full">
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════ MENTOR LIST TAB ═══════════ */}
      {activeTab === 'list' && (
        <>
          {/* Toolbar */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, lĩnh vực..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              {(['all', 'active', 'inactive'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterActive(f)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    filterActive === f ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang hoạt động' : 'Đã tắt'}
                </button>
              ))}
            </div>
            <button
              onClick={fetchMentors}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <RefreshCcw size={16} /> Làm mới
            </button>
          </div>

          {/* Stats bar */}
          <div className="mt-4 flex gap-4 text-sm text-gray-600">
            <span><strong className="text-gray-800">{mentors.length}</strong> mentor tổng</span>
            <span><strong className="text-emerald-700">{mentors.filter(m => m.isActive).length}</strong> đang hoạt động</span>
            <span><strong className="text-gray-500">{mentors.filter(m => !m.isActive).length}</strong> đã tắt</span>
          </div>

          {/* List */}
          {loading ? (
            <div className="mt-8 flex justify-center">
              <Loader2 size={28} className="animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-12 text-center text-gray-500">
              <User size={48} className="mx-auto text-gray-300" />
              <p className="mt-4">Không tìm thấy mentor nào</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((mentor) => (
                <div key={mentor.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {/* Mentor header row */}
                  <div className="flex flex-wrap items-center gap-4 p-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-600">
                      {mentor.avatarUrl ? (
                        <Image src={mentor.avatarUrl} alt="" width={48} height={48} className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        mentor.fullName?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 truncate">{mentor.fullName}</p>
                        {mentor.isActive ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle size={10} /> Hoạt động
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            <XCircle size={10} /> Đã tắt
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {mentor.title ? `${mentor.title} • ` : ''}{mentor.subject}
                        {mentor.company ? ` • ${mentor.company}` : ''}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="flex items-center gap-1 font-semibold text-amber-600">
                          <Star size={14} className="fill-amber-500" /> {mentor.rating?.toFixed(1) || '—'}
                        </p>
                        <p className="text-xs text-gray-500">{mentor.reviewCount || 0} đánh giá</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-800">{formatPrice(mentor.pricePerSession)}</p>
                        <p className="text-xs text-gray-500">/ buổi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(mentor)}
                        disabled={toggleLoading === mentor.id}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                          mentor.isActive
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                        title={mentor.isActive ? 'Tắt mentor' : 'Bật mentor'}
                      >
                        {toggleLoading === mentor.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : mentor.isActive ? (
                          <ToggleRight size={15} />
                        ) : (
                          <ToggleLeft size={15} />
                        )}
                        {mentor.isActive ? 'Tắt' : 'Bật'}
                      </button>
                      <button
                        onClick={() => startEdit(mentor)}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                      >
                        <Edit3 size={14} /> Sửa
                      </button>
                      <button
                        onClick={() => setExpandedId(expandedId === mentor.id ? null : mentor.id)}
                        className="rounded-xl bg-gray-50 p-1.5 text-gray-500 hover:bg-gray-100"
                      >
                        {expandedId === mentor.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === mentor.id && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Bio</p>
                          <p className="text-sm text-gray-700">{mentor.bio || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Lĩnh vực</p>
                          <div className="flex flex-wrap gap-1">
                            {(mentor.subjects?.length ? mentor.subjects : [mentor.subject]).map((s) => (
                              <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Lịch trống</p>
                          <div className="flex flex-wrap gap-1">
                            {mentor.availability?.length ? mentor.availability.map((a) => (
                              <span key={a} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{a}</span>
                            )) : <span className="text-sm text-gray-500">—</span>}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Ngân hàng</p>
                          <p className="text-sm text-gray-700">
                            {mentor.bankName ? `${mentor.bankName} — ${mentor.bankAccountNumber}` : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit form */}
                  {editingId === mentor.id && (
                    <div className="border-t border-blue-100 bg-blue-50/30 px-4 py-4">
                      <h4 className="mb-3 font-semibold text-gray-800">Chỉnh sửa hồ sơ</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          { key: 'fullName', label: 'Họ tên' },
                          { key: 'title', label: 'Chức danh' },
                          { key: 'subject', label: 'Lĩnh vực chính' },
                          { key: 'company', label: 'Công ty' },
                          { key: 'university', label: 'Trường ĐH' },
                          { key: 'experience', label: 'Kinh nghiệm' },
                          { key: 'bankName', label: 'Ngân hàng' },
                          { key: 'bankAccountNumber', label: 'Số tài khoản' },
                        ].map(({ key, label }) => (
                          <div key={key}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                            <input
                              type="text"
                              value={(editForm[key as keyof typeof editForm] as string) || ''}
                              onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Giá / buổi (VND)</label>
                          <input
                            type="number"
                            value={editForm.pricePerSession || ''}
                            onChange={(e) => setEditForm({ ...editForm, pricePerSession: Number(e.target.value) })}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Giới thiệu</label>
                          <textarea
                            value={editForm.bio || ''}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            rows={3}
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-500"
                          />
                        </div>
                      </div>
                      {saveMsg && (
                        <p className={`mt-2 text-sm ${saveMsg.includes('thành công') ? 'text-emerald-600' : 'text-red-500'}`}>
                          {saveMsg}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saveLoading}
                          className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                          {saveLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Lưu
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setSaveMsg(''); }}
                          className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
                        >
                          <X size={14} /> Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════ REQUESTS TAB ═══════════ */}
      {activeTab === 'requests' && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="denied">Đã từ chối</option>
            </select>
            <button
              onClick={() => fetchRequests()}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              <RefreshCcw size={16} /> Làm mới
            </button>
          </div>

          {requestsLoading ? (
            <Loading />
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full min-w-[1000px] table-fixed">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="w-[140px] px-4 py-4 text-left text-sm font-semibold text-gray-700">Người đăng ký</th>
                    <th className="w-[160px] px-4 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="w-[120px] px-4 py-4 text-left text-sm font-semibold text-gray-700">Môn học</th>
                    <th className="w-[100px] px-4 py-4 text-left text-sm font-semibold text-gray-700">Kinh nghiệm</th>
                    <th className="w-[100px] px-4 py-4 text-left text-sm font-semibold text-gray-700">Giá/buổi</th>
                    <th className="w-[120px] px-4 py-4 text-left text-sm font-semibold text-gray-700">Ngân hàng</th>
                    <th className="w-[110px] px-4 py-4 text-left text-sm font-semibold text-gray-700">Số TK</th>
                    <th className="w-[90px] px-4 py-4 text-left text-sm font-semibold text-gray-700">Ngày gửi</th>
                    <th className="w-[100px] px-4 py-4 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                    <th className="w-[140px] px-4 py-4 text-right text-sm font-semibold text-gray-700">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                        Chưa có yêu cầu Mentor nào
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-800 truncate" title={req.fullName}>{req.fullName}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 truncate" title={req.email}>{req.email}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 truncate" title={req.subject}>{req.subject}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 truncate">{req.experience || '—'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{formatPrice(req.pricePerSession)}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 truncate">{req.bankName || '—'}</td>
                        <td className="px-4 py-4 text-sm font-mono text-gray-600 truncate">{req.bankAccountNumber || '—'}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{formatDate(req.createdAt)}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            req.status === 'pending' ? 'bg-amber-100 text-amber-700'
                              : req.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {req.status === 'pending' ? 'Chờ duyệt' : req.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {req.status === 'pending' ? (
                            <select
                              value=""
                              onChange={(e) => {
                                const action = e.target.value;
                                e.target.value = '';
                                if (action === 'approve') handleApprove(req.id);
                                else if (action === 'deny') handleDeny(req.id);
                              }}
                              disabled={actionLoading === req.id}
                              className="min-w-[120px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                            >
                              <option value="">Chọn thao tác</option>
                              <option value="approve">Duyệt</option>
                              <option value="deny">Từ chối</option>
                            </select>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
