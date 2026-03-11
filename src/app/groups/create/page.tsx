'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  ArrowLeft,
  Globe,
  Hash,
  ImagePlus,
  Lock,
  Mail,
  Plus,
  Send,
  Users,
  X,
  Crown,
  Sparkles,
} from 'lucide-react';

const SUBJECT_SUGGESTIONS = [
  'Toán', 'Giải tích', 'CNTT', 'Lập trình', 'Web', 'AI',
  'CSDL', 'Tiếng Anh', 'Vật lý', 'Kinh tế', 'Hóa học',
];

export default function CreateGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Role & VIP state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const isMentorOrAdmin = userRole === 'Mentor' || userRole === 'Admin' || userRole === 'Staff';
  const canCreateGroup = isVip || isMentorOrAdmin;
  const canCreatePrivate = isMentorOrAdmin;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    setUserRole(role);

    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch VIP status from API
    fetch('/api/user/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          const u = data.data;
          const now = new Date();
          const vipActive = u.vipPlan && u.vipExpiresAt && new Date(u.vipExpiresAt) > now;
          setIsVip(!!vipActive);
          // Also update role from API if present
          if (u.role) setUserRole(u.role);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAccess(false));
  }, [router]);

  const canSubmit = name.trim().length >= 3;

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Vui lòng nhập tên nhóm';
    else if (name.trim().length < 3) newErrors.name = 'Tên nhóm tối thiểu 3 ký tự';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const COVER_COLORS = [
        'from-slate-800 via-slate-900 to-slate-950',
        'from-slate-700 via-slate-800 to-slate-900',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-indigo-500 to-blue-600',
        'from-cyan-500 to-blue-600',
        'from-slate-600 to-slate-800',
        'from-slate-700 to-slate-900',
      ];
      const randomColor = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          subjectTags: tags,
          isPrivate,
          coverColor: randomColor,
        }),
      });

      const data = await res.json();

      if (res.ok && data.data?.id) {
        router.push(`/groups/${data.data.id}`);
      } else {
        setErrors({ name: data.message || 'Có lỗi xảy ra khi tạo nhóm' });
      }
    } catch {
      setErrors({ name: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Loading access check */}
      {checkingAccess ? (
        <main className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        </main>
      ) : !canCreateGroup ? (
        /* Regular users — upgrade prompt */
        <main className="px-4 py-16 mx-auto max-w-lg sm:px-6 text-center">
          <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-amber-100 rounded-2xl">
              <Crown size={32} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Nâng cấp để tạo nhóm</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Chỉ thành viên <span className="font-semibold text-amber-600">VIP</span> hoặc <span className="font-semibold text-slate-700">Mentor</span> mới có quyền tạo nhóm học.
              Nâng cấp tài khoản VIP để tạo nhóm công khai và tham gia các tính năng cao cấp.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/upgrade"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-semibold text-white bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-100 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Sparkles size={16} />
                Nâng cấp VIP
              </Link>
              <Link
                href="/groups"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Quay lại danh sách nhóm
              </Link>
            </div>
          </div>
        </main>
      ) : (
      <main className="px-4 py-6 mx-auto max-w-2xl sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/groups"
              className="flex items-center justify-center w-10 h-10 text-gray-600 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Quay lại"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Tạo nhóm mới</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              canSubmit && !loading
                ? 'text-white bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang tạo...
              </span>
            ) : (
              <>
                <Plus size={16} />
                Tạo nhóm
              </>
            )}
          </button>
        </div>

        {/* Form */}
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-5">
          {/* Group Name */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
              <Users size={16} />
              Tên nhóm <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Giải tích 1 - Nhóm 7"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors({});
              }}
              className={`w-full px-4 py-3 text-sm border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Subject Tags */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
              <Hash size={16} />
              Môn học / Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-full"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Nhập tag và nhấn Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              disabled={tags.length >= 5}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
            />
            {/* Suggested */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUBJECT_SUGGESTIONS.filter((s) => !tags.includes(s))
                .slice(0, 6)
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2.5 py-1 text-xs text-gray-500 bg-gray-100 rounded-full hover:bg-slate-50 hover:text-slate-600 transition-all"
                  >
                    +{tag}
                  </button>
                ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Mô tả ngắn
            </label>
            <textarea
              placeholder="Mô tả ngắn gọn về nhóm (tối đa 200 ký tự)"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              rows={3}
              className="w-full px-4 py-3 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none transition-all"
              maxLength={200}
            />
            <p className="mt-1 text-xs text-gray-400 text-right">{description.length}/200</p>
          </div>

          {/* Privacy Toggle - Only shown to Mentor/Admin */}
          {canCreatePrivate ? (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-xl">
                  <Lock size={20} className="text-amber-600" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-xl">
                  <Globe size={20} className="text-emerald-600" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {isPrivate ? 'Nhóm riêng tư' : 'Nhóm công khai'}
                </p>
                <p className="text-xs text-gray-500">
                  {isPrivate
                    ? 'Chỉ thành viên được duyệt mới tham gia'
                    : 'Ai cũng có thể tìm và tham gia nhóm'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isPrivate ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              role="switch"
              aria-checked={isPrivate}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isPrivate ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-xl">
              <Globe size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Nhóm công khai</p>
              <p className="text-xs text-gray-500">
                Thành viên VIP chỉ được tạo nhóm công khai. Chỉ Mentor được tạo nhóm riêng tư.
              </p>
            </div>
          </div>
          )}

          {/* Cover Image Upload */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Ảnh bìa (tùy chọn)
            </label>
            <button
              type="button"
              className="flex items-center gap-2 w-full px-4 py-8 text-sm font-medium text-slate-600 border-2 border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
            >
              <ImagePlus size={20} />
              Tải lên ảnh bìa (tỉ lệ 16:6)
            </button>
          </div>

          {/* Invite Members */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
              <Mail size={16} />
              Mời thành viên (tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Nhập email hoặc tên bạn bè, cách nhau bởi dấu phẩy"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
            />
            <p className="mt-1 text-xs text-gray-400">
              Lời mời sẽ được gửi qua email sau khi tạo nhóm
            </p>
          </div>
        </div>
      </main>
      )}
      <Footer />
    </div>
  );
}
