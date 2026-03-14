'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import { RefreshCcw, Users, Lock, Globe } from 'lucide-react';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  coverColor: string;
  subjectTags: string[];
  isPrivate: boolean;
  createdBy: string;
  membersCount: number;
  createdAt: string | Date;
  userMembershipStatus?: string;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/groups', { headers });
      if (res.status === 401 || res.status === 403) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (data.data) {
        setGroups(data.data as StudyGroup[]);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const formatDate = (s: string | Date) => {
    if (!s) return '-';
    try {
      const d = typeof s === 'string' ? new Date(s) : s;
      return d.toLocaleDateString('vi-VN');
    } catch {
      return '-';
    }
  };

  return (
    <div className="p-6">
      <DashboardHeader title="Quản lý nhóm học" />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={() => fetchGroups()}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <RefreshCcw size={16} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Nhóm
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Thành viên
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Chủ đề
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Quyền truy cập
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
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Chưa có nhóm học nào
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${group.coverColor || 'from-slate-600 to-slate-800'} text-white`}
                        >
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{group.name}</p>
                          <p className="max-w-xs truncate text-sm text-gray-500">
                            {group.description || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        <Users size={14} />
                        {group.membersCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {group.subjectTags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-violet-50 px-2 py-0.5 text-xs text-violet-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {(!group.subjectTags || group.subjectTags.length === 0) && (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {group.isPrivate ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                          <Lock size={12} />
                          Riêng tư
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          <Globe size={12} />
                          Công khai
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(group.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/groups/${group.id}`}
                        className="text-sm font-medium text-slate-600 hover:text-slate-800"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
