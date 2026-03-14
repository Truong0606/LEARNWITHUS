'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import { RefreshCcw, MessageSquare, Heart, MessageCircle } from 'lucide-react';

interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorTag: string;
  groupId: string | null;
  groupName: string | null;
  title: string;
  body: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  pinned: boolean;
  anonymous: boolean;
  createdAt: string;
}

interface StudyGroup {
  id: string;
  name: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupIdFilter, setGroupIdFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const apiUrl =
        groupIdFilter && groupIdFilter !== '__community__'
          ? `/api/admin/posts?groupId=${encodeURIComponent(groupIdFilter)}`
          : '/api/admin/posts';

      const [postsRes, groupsRes] = await Promise.all([
        fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (postsRes.status === 401 || postsRes.status === 403) {
        setError('Bạn không có quyền xem danh sách bài viết');
        setPosts([]);
      } else if (!postsRes.ok) {
        setError(`Không thể tải danh sách bài viết (${postsRes.status})`);
        setPosts([]);
      } else {
        const postsData = await postsRes.json();
        if (postsData?.data) {
          setPosts(postsData.data as CommunityPost[]);
        } else {
          setPosts([]);
        }
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        if (groupsData.data) setGroups(groupsData.data as StudyGroup[]);
      }
    } catch (err) {
      setError('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupIdFilter]);

  const formatDate = (s: string) => {
    if (!s) return '-';
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

  return (
    <div className="p-6">
      <DashboardHeader title="Quản lý bài viết" />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <select
          value={groupIdFilter}
          onChange={(e) => setGroupIdFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
        >
          <option value="">Tất cả bài viết</option>
          <option value="__community__">Diễn đàn chung (không nhóm)</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => fetchData()}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <RefreshCcw size={16} />
          Làm mới
        </button>
      </div>

      {groupIdFilter === '__community__' && (
        <p className="mt-2 text-sm text-gray-500">
          Lọc theo nhóm sẽ áp dụng khi chọn một nhóm cụ thể. &quot;Diễn đàn chung&quot; hiển thị bài viết không thuộc nhóm nào.
        </p>
      )}

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
                  Bài viết
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Tác giả
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Nhóm
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Tương tác
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Ngày đăng
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {error ? 'Không có dữ liệu' : 'Chưa có bài viết nào'}
                  </td>
                </tr>
              ) : (
                posts
                  .filter((p) => {
                    if (groupIdFilter === '__community__') {
                      return !p.groupId || p.groupId === '';
                    }
                    if (groupIdFilter) return p.groupId === groupIdFilter;
                    return true;
                  })
                  .map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="font-medium text-gray-800 line-clamp-2">
                            {post.title || post.body?.slice(0, 80) || '—'}
                          </p>
                          {post.body && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                              {post.body}
                            </p>
                          )}
                          {post.tags?.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {post.anonymous ? 'Ẩn danh' : post.authorName}
                          </p>
                          <p className="text-xs text-gray-500">{post.authorTag}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {post.groupName || 'Diễn đàn chung'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <Heart size={14} />
                            {post.likesCount}
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                            <MessageCircle size={14} />
                            {post.commentsCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/community/${post.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-800"
                        >
                          <MessageSquare size={14} />
                          Xem
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
