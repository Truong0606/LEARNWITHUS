'use client';

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import { RefreshCcw, UserCheck, UserX, Pencil, Trash2, X, Crown } from 'lucide-react';

interface UserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  isActive: boolean;
  isVip: boolean;
  vipPlan: string | null;
  vipExpiresAt: string | null;
  createdAt: string | Date;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<UserDto | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserDto>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const url = roleFilter
        ? `/api/user?role=${encodeURIComponent(roleFilter)}`
        : '/api/user';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        setError('Bạn không có quyền xem danh sách người dùng');
        setUsers([]);
        return;
      }
      const data = await res.json();
      if (data.data) {
        setUsers(data.data as UserDto[]);
      }
    } catch (err) {
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleEdit = (user: UserDto) => {
    setEditModal(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading('edit');
    try {
      // role 1 = Admin (full admin access)
      const roleMap: Record<string, number> = {
        Admin: 1,
        Staff: 0,
        Client: 2,
        Manager: 3,
        Mentor: 4,
      };
      const body: Record<string, unknown> = {};
      if (editForm.fullName !== undefined) body.fullName = editForm.fullName;
      if (editForm.email !== undefined) body.email = editForm.email;
      if (editForm.phone !== undefined) body.phone = editForm.phone;
      if (editForm.address !== undefined) body.address = editForm.address;
      if (editForm.isActive !== undefined) body.isActive = editForm.isActive;
      if (editForm.role !== undefined) {
        const r = roleMap[editForm.role] ?? Number(editForm.role);
        if (!isNaN(r)) body.role = r;
      }

      const res = await fetch(`/api/admin/users/${editModal.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        setEditModal(null);
        fetchUsers();
      } else {
        alert(data.message || 'Cập nhật thất bại');
      }
    } catch {
      alert('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: UserDto) => {
    if (!confirm(`Bạn có chắc muốn vô hiệu hóa tài khoản "${user.fullName}"?`)) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.message || 'Thao tác thất bại');
      }
    } catch {
      alert('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReenable = async (user: UserDto) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      });
      const data = await res.json();

      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.message || 'Kích hoạt thất bại');
      }
    } catch {
      alert('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (s: string | Date) => {
    if (!s) return '-';
    try {
      const d = typeof s === 'string' ? new Date(s) : s;
      return d.toLocaleDateString('vi-VN');
    } catch {
      return '-';
    }
  };

  const roleLabels: Record<string, string> = {
    Admin: 'Quản trị',
    Staff: 'Nhân viên',
    Client: 'Khách hàng',
    Manager: 'Quản lý',
    Mentor: 'Mentor',
  };

  return (
    <div className="p-6">
      <DashboardHeader title="Quản lý sinh viên" />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
        >
          <option value="">Tất cả vai trò</option>
          <option value="1">Quản trị (Admin)</option>
          <option value="0">Nhân viên (Staff)</option>
          <option value="2">Client</option>
          <option value="3">Manager</option>
          <option value="4">Mentor</option>
        </select>
        <button
          onClick={() => fetchUsers()}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <RefreshCcw size={16} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Người dùng
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Số điện thoại
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {error ? 'Không có dữ liệu' : 'Chưa có người dùng nào'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-semibold ${
                          user.isVip
                            ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-2 ring-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {user.isVip ? <Crown size={18} /> : (user.fullName?.charAt(0) || '?')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.fullName}</p>
                          <p className="text-xs text-gray-500">
                            {user.isVip && user.vipExpiresAt
                              ? `VIP đến ${formatDate(user.vipExpiresAt)}`
                              : user.address || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {roleLabels[user.role] || user.role}
                        </span>
                        {user.isVip && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <Crown size={12} />
                            VIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.isActive ? (
                          <>
                            <UserCheck size={12} />
                            Hoạt động
                          </>
                        ) : (
                          <>
                            <UserX size={12} />
                            Vô hiệu
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                        >
                          <Pencil size={14} />
                          Sửa
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Vô hiệu hóa
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReenable(user)}
                            disabled={actionLoading === user.id}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                          >
                            <UserCheck size={14} />
                            Kích hoạt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Sửa người dùng</h3>
              <button
                onClick={() => setEditModal(null)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Họ tên</label>
                <input
                  type="text"
                  value={editForm.fullName ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editForm.email ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Số điện thoại</label>
                <input
                  type="text"
                  value={editForm.phone ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ</label>
                <input
                  type="text"
                  value={editForm.address ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Vai trò</label>
                <select
                  value={editForm.role ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive ?? true}
                  onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Tài khoản hoạt động
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setEditModal(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading === 'edit'}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
              >
                {actionLoading === 'edit' ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
