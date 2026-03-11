'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  FileText,
  Paperclip,
  FileImage,
} from 'lucide-react';

const SUGGESTED_TAGS = [
  'Toán', 'Lập trình', 'AI', 'CSDL', 'Tiếng Anh', 'Ôn thi',
  'Chia sẻ', 'Hỏi đáp', 'Tìm nhóm', 'Kinh nghiệm',
];

function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const groupIdFromUrl = searchParams.get('groupId');
  const groupId = groupIdFromUrl || null;

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [documents, setDocuments] = useState<{ file: File; name: string; type: string; size: number }[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [groupName, setGroupName] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      fetch(`/api/groups/${groupId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.name) setGroupName(data.data.name);
        })
        .catch(() => {});
    }
  }, [groupId]);

  const canSubmit = title.trim() || body.trim() || images.length > 0 || documents.length > 0;
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

  const ALLOWED_DOC_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'image/jpeg', 'image/png'];
  const ALLOWED_DOC_EXTS = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png'];

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs: { file: File; name: string; type: string; size: number }[] = [];
    const errorMsgs: string[] = [];

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_DOC_TYPES.includes(file.type) && !ALLOWED_DOC_EXTS.includes(ext)) {
        errorMsgs.push(`"${file.name}" không hỗ trợ (chỉ PDF, DOCX, JPG, PNG)`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        errorMsgs.push(`"${file.name}" quá lớn (tối đa 10MB)`);
        return;
      }
      if (documents.length + newDocs.length >= 5) {
        errorMsgs.push('Tối đa 5 tài liệu');
        return;
      }
      newDocs.push({ file, name: file.name, type: ext, size: file.size });
    });

    if (errorMsgs.length > 0) {
      setErrors({ documents: errorMsgs.join('. ') });
    } else {
      setErrors((prev) => { const { documents: _, ...rest } = prev; return rest; });
    }

    setDocuments((prev) => [...prev, ...newDocs].slice(0, 5));
    e.target.value = '';
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      const imageUrls: string[] = [];

      if (images.length > 0) {
        for (const img of images) {
          const formData = new FormData();
          formData.append('file', img.file);
          formData.append('folder', 'community');

          const uploadRes = await fetch('/api/upload/image', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.data?.url) {
            imageUrls.push(uploadData.data.url);
          } else {
            setErrors({ submit: uploadData.message || 'Lỗi tải ảnh lên' });
            setLoading(false);
            return;
          }
        }
      }

      // Upload documents
      const uploadedAttachments: { url: string; name: string; type: string; size: number }[] = [];

      if (documents.length > 0) {
        for (const doc of documents) {
          const formData = new FormData();
          formData.append('file', doc.file);

          const uploadRes = await fetch('/api/upload/file', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.data) {
            uploadedAttachments.push(uploadData.data);
          } else {
            setErrors({ submit: uploadData.message || 'Lỗi tải tài liệu lên' });
            setLoading(false);
            return;
          }
        }
      }

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
          images: imageUrls,
          attachments: uploadedAttachments,
        }),
      });

      const data = await res.json();

      if (res.ok && data.data?.id) {
        if (groupId) {
          router.push(`/groups/${groupId}`);
        } else {
          router.push(`/community/${data.data.id}`);
        }
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
              href={groupId ? `/groups/${groupId}` : '/community'}
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
                ? 'text-white bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5'
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
          {/* Post destination (read-only, based on context) */}
          <div className="flex items-center gap-2 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl">
            <Users size={16} className="text-slate-500" />
            <span className="text-gray-600">Đăng vào:</span>
            <span className="font-semibold text-slate-800">
              {groupId ? (groupName || `Nhóm ${groupId}`) : 'Cộng đồng'}
            </span>
          </div>

          {/* Title */}
          <div>
            <input
              type="text"
              placeholder="Tiêu đề bài viết (tùy chọn)"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              className="w-full px-4 py-3 text-base font-semibold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent placeholder:text-gray-400 placeholder:font-normal transition-all"
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
              className="w-full px-4 py-3 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent placeholder:text-gray-400 resize-none transition-all"
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 3}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  images.length >= 3
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <ImagePlus size={16} />
                Thêm ảnh ({images.length}/3)
              </button>
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

          {/* Document Upload */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
              <Paperclip size={16} />
              Tài liệu đính kèm
            </label>
            <input
              ref={docInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
              multiple
              onChange={handleDocUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              disabled={documents.length >= 5}
              className={`flex items-center gap-2 w-full px-4 py-3 text-sm font-medium border-2 border-dashed rounded-xl transition-all ${
                documents.length >= 5
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <FileText size={18} />
              Tải lên PDF, DOCX, JPG, PNG (tối đa 5 tệp, 10MB/tệp)
            </button>
            {errors.documents && (
              <p className="mt-1 text-sm text-red-500">{errors.documents}</p>
            )}
            {documents.length > 0 && (
              <div className="mt-3 space-y-2">
                {documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    {['jpg', 'jpeg', 'png'].includes(doc.type) ? (
                      <FileImage size={18} className="text-emerald-500 flex-shrink-0" />
                    ) : (
                      <FileText size={18} className="text-blue-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.type.toUpperCase()} · {formatFileSize(doc.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="Xóa tệp"
                    >
                      <X size={14} />
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
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 rounded-full"
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
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent placeholder:text-gray-400 transition-all"
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
                    className="px-2.5 py-1 text-xs text-gray-500 bg-gray-100 rounded-full hover:bg-slate-50 hover:text-slate-600 transition-all"
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
                anonymous ? 'bg-slate-500' : 'bg-gray-300'
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

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <CreatePostContent />
    </Suspense>
  );
}
