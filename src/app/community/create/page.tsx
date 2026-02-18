'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components/shared';
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Send,
  X,
  Hash,
  Users,
  EyeOff,
  Eye,
} from 'lucide-react';

const SUGGESTED_TAGS = [
  'Toán', 'Lập trình', 'AI', 'CSDL', 'Tiếng Anh', 'Ôn thi',
  'Chia sẻ', 'Hỏi đáp', 'Tìm nhóm', 'Kinh nghiệm',
];

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [groupId, setGroupId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  // Fetch user's joined groups from API
  const fetchGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/groups', { headers });
      const data = await res.json();
      if (res.ok && data.data) {
        const joinedGroups = data.data
          .filter((g: { userMembershipStatus: string }) => g.userMembershipStatus === 'member')
          .map((g: { id: string; name: string }) => ({ id: g.id, name: g.name }));
        setGroups(joinedGroups);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const canSubmit = title.trim() || body.trim() || images.length > 0;
  const charCount = body.length;

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: { file: File; preview: string }[] = [];
    const errorMsgs: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        errorMsgs.push(`"${file.name}" quá lớn (max 5MB)`);
        return;
      }
      if (images.length + newImages.length >= 3) {
        errorMsgs.push('Tối đa 3 ảnh');
        return;
      }
      newImages.push({ file, preview: URL.createObjectURL(file) });
    });

    if (errorMsgs.length > 0) {
      setErrors({ images: errorMsgs.join('. ') });
    } else {
      setErrors({});
    }

    setImages((prev) => [...prev, ...newImages].slice(0, 3));
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          groupId: groupId || undefined,
          tags,
          anonymous,
        }),
      });

      const data = await res.json();

      if (res.ok && data.data?.id) {
        router.push(`/community/${data.data.id}`);
      } else {
        setErrors({ submit: data.message || 'Có lỗi xảy ra' });
      }
    } catch {
      setErrors({ submit: 'Lỗi kết nối. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="px-4 py-6 mx-auto max-w-2xl sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/community"
              className="flex items-center justify-center w-10 h-10 text-gray-600 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Quay lại"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Tạo bài mới</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              canSubmit && !loading
                ? 'text-white bg-gradient-to-r from-violet-500 to-pink-500 shadow-lg shadow-violet-200 hover:shadow-xl hover:-translate-y-0.5'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang đăng...
              </span>
            ) : (
              <>
                <Send size={16} />
                Đăng bài
              </>
            )}
          </button>
        </div>

        {/* Form */}
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-5">
          {/* Group Selector */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
              <Users size={16} />
              Đăng vào
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            >
              <option value="">Tất cả (không chọn nhóm)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Tiêu đề bài viết (tùy chọn)"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              className="w-full px-4 py-3 text-base font-semibold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400 placeholder:font-normal transition-all"
              maxLength={100}
            />
            <p className="mt-1 text-xs text-gray-400 text-right">{title.length}/100</p>
          </div>

          {/* Body */}
          <div>
            <textarea
              placeholder="Bạn đang nghĩ gì về môn học hôm nay? Chia sẻ câu hỏi, tài liệu, kinh nghiệm..."
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 2000))}
              rows={6}
              className="w-full px-4 py-3 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400 resize-none transition-all"
              maxLength={2000}
              style={{ minHeight: '150px' }}
            />
            <p className={`mt-1 text-xs text-right ${charCount > 1800 ? 'text-amber-500' : 'text-gray-400'}`}>
              {charCount}/2000
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <div className="flex items-center gap-3 mb-2">

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {errors.images && (
              <p className="mb-2 text-sm text-red-500">{errors.images}</p>
            )}
            {images.length > 0 && (
              <div className="flex gap-3 mt-2">
                {images.map((img, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                      aria-label="Xóa ảnh"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
              <Hash size={16} />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-full"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Nhập tag và nhấn Enter (tối đa 5)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              disabled={tags.length >= 5}
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-gray-400 transition-all"
            />
            {/* Suggested tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t))
                .slice(0, 6)
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="px-2.5 py-1 text-xs text-gray-500 bg-gray-100 rounded-full hover:bg-violet-50 hover:text-violet-600 transition-all"
                  >
                    +{tag}
                  </button>
                ))}
            </div>
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              {anonymous ? <EyeOff size={16} className="text-gray-500" /> : <Eye size={16} className="text-gray-500" />}
              <span className="text-sm text-gray-700">{anonymous ? 'Đăng ẩn danh' : 'Hiện tên thật'}</span>
            </div>
            <button
              type="button"
              onClick={() => setAnonymous(!anonymous)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                anonymous ? 'bg-violet-500' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={anonymous}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  anonymous ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Error */}
          {errors.submit && (
            <p className="text-sm text-center text-red-500 font-medium">{errors.submit}</p>
          )}

          {/* Hint */}
          <p className="text-xs text-gray-400 text-center">
            Nhập tối đa 2000 ký tự
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
