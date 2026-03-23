'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header, Footer } from '@/components/shared';
import {
  Search,
  GraduationCap,
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  ChevronRight,
  Filter,
  Loader2,
  Star,
} from 'lucide-react';
import type { MentorProfile } from '@/types';

// Môn học khớp với form đăng ký mentor
const subjectFilterOptions = [
  'Lập trình Web',
  'Toán rời rạc',
  'Trí tuệ nhân tạo',
  'Cơ sở dữ liệu',
  'IELTS',
  'Kinh tế học',
  'Vật lý',
  'Hóa học',
];

const sortOptions = [
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'sessions', label: 'Nhiều buổi nhất' },
];

const dayFilterOptions = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const timeFilterOptions = [
  { value: 'Sáng', label: 'Sáng (8h-12h)' },
  { value: 'Chiều', label: 'Chiều (13h-17h)' },
  { value: 'Tối', label: 'Tối (18h-21h)' },
];

export default function MentorsPage() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [filterTime, setFilterTime] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [isMentor, setIsMentor] = useState<boolean | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Check if current user is already a mentor (to hide "Đăng ký làm Mentor" CTA)
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setIsMentor(false);
      return;
    }
    const checkMentor = async () => {
      try {
        const res = await fetch('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setIsMentor((data.data as { isMentor?: boolean }).isMentor ?? false);
        } else {
          setIsMentor(false);
        }
      } catch {
        setIsMentor(false);
      }
    };
    checkMentor();
  }, []);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', '30');
        if (searchQuery) params.set('search', searchQuery);
        if (activeSubject) params.set('subject', activeSubject);
        const res = await fetch(`/api/mentors?${params}`);
        const data = await res.json();
        setMentors(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchMentors, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, activeSubject]);

  const filteredAndSortedMentors = useMemo(() => {
    let list = [...mentors];

    // Lọc theo ngày rảnh
    if (filterDay) {
      list = list.filter((m) => {
        const avail = Array.isArray(m.availability) ? m.availability : (m.availability ? String(m.availability).split(',') : []);
        return avail.some((s: string) => s.trim().startsWith(filterDay));
      });
    }

    // Lọc theo thời gian rảnh
    if (filterTime) {
      list = list.filter((m) => {
        const avail = Array.isArray(m.availability) ? m.availability : (m.availability ? String(m.availability).split(',') : []);
        return avail.some((s: string) => s.includes(filterTime));
      });
    }

    // Sắp xếp
    switch (sortBy) {
      case 'price_asc':
        return list.sort((a, b) => (a.pricePerSession || 0) - (b.pricePerSession || 0));
      case 'price_desc':
        return list.sort((a, b) => (b.pricePerSession || 0) - (a.pricePerSession || 0));
      case 'sessions':
        return list.sort((a, b) => (b.sessionCount || 0) - (a.sessionCount || 0));
      default:
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
  }, [mentors, filterDay, filterTime, sortBy]);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[parts.length - 2][0] + parts[parts.length - 1][0];
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 py-16 md:py-20">
          <div className="px-4 mx-auto max-w-[1800px] sm:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center">
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Cộng đồng Mentor
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-300 md:text-xl">
              Tiến nhanh và xa hơn trong hành trình học tập cùng Learn With Us
            </p>
          </div>
        </section>

        {/* Môn học filter chips */}
        <section className="border-b border-gray-200 bg-white">
          <div className="px-4 py-4 mx-auto max-w-[1800px] sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveSubject(null)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                  !activeSubject ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả
              </button>
              {subjectFilterOptions.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setActiveSubject(activeSubject === subj ? null : subj)}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                    activeSubject === subj
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Search bar */}
        <section className="border-b border-gray-200 bg-white">
          <div className="px-4 py-4 mx-auto max-w-[1800px] sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="relative max-w-xl">
              <Search
                size={20}
                className="absolute text-slate-400 left-4 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                placeholder="Tìm kiếm mentor theo tên, môn học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-12 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto flex max-w-[1800px] flex-col gap-6 lg:flex-row">
            {/* Sidebar filters */}
            <aside className="w-full flex-shrink-0 lg:w-80 lg:min-w-[280px]">
              <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Lọc kết quả</h3>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1 text-sm text-slate-600 lg:hidden"
                  >
                    <Filter size={16} />
                    {showFilters ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>

                <div className={`space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Ngày rảnh
                    </label>
                    <select
                      value={filterDay ?? ''}
                      onChange={(e) => setFilterDay(e.target.value || null)}
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Tất cả</option>
                      {dayFilterOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Thời gian rảnh
                    </label>
                    <select
                      value={filterTime ?? ''}
                      onChange={(e) => setFilterTime(e.target.value || null)}
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Tất cả</option>
                      {timeFilterOptions.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Sắp xếp theo
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveSubject(null);
                      setFilterDay(null);
                      setFilterTime(null);
                      setSortBy('rating');
                    }}
                    className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </aside>

            {/* Mentor list */}
            <div className="flex-1 min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-800">
                  {loading ? 'Đang tải...' : `Tìm thấy ${filteredAndSortedMentors.length} Mentor cho bạn!`}
                </h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-800 lg:hidden"
                >
                  <Filter size={16} />
                  Lọc kết quả
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAndSortedMentors.map((mentor) => (
                    <Link
                      key={mentor.id}
                      href={`/mentors/${mentor.id}`}
                      className="block overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        {mentor.avatarUrl ? (
                          <Image
                            src={mentor.avatarUrl}
                            alt={mentor.fullName}
                            width={80}
                            height={80}
                            className="h-20 w-20 flex-shrink-0 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-2xl font-bold text-white">
                            {getInitials(mentor.fullName)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-slate-800">
                                {mentor.fullName}
                              </h3>
                              <p className="text-sm text-slate-600">
                                {mentor.title ? `${mentor.title}` : ''}{' '}
                                {mentor.company ? `tại ${mentor.company}` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-700">
                                {formatPrice(mentor.pricePerSession)}
                              </p>
                              <p className="text-xs text-slate-500">/ buổi</p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                            {mentor.rating > 0 && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Star size={14} className="fill-amber-500" />
                                {mentor.rating.toFixed(1)}
                                <span className="text-slate-400">({mentor.reviewCount})</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {mentor.menteeCount} mentee
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={14} />
                              {mentor.sessionCount} buổi
                            </span>
                          </div>

                          {mentor.bio && (
                            <div className="mt-3">
                              <p className="line-clamp-2 text-sm text-slate-600">{mentor.bio}</p>
                            </div>
                          )}

                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1">
                              {(mentor.subjects ?? []).slice(0, 4).map((s) => (
                                <span
                                  key={s}
                                  className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                >
                                  {s}
                                </span>
                              ))}
                              {(mentor.subjects ?? []).length > 4 && (
                                <span className="text-xs text-slate-400">
                                  +{mentor.subjects.length - 4}
                                </span>
                              )}
                            </div>
                          </div>

                          {(() => {
                            const avail = Array.isArray(mentor.availability) ? mentor.availability : [];
                            return avail.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                                <Calendar size={12} />
                                Lịch rảnh: {avail.slice(0, 3).join(', ')}
                                {avail.length > 3 && '...'}
                              </div>
                            );
                          })()}

                          <div className="mt-3 flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900">
                            Xem chi tiết
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {!loading && filteredAndSortedMentors.length === 0 && (
                <div className="py-16 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <GraduationCap size={32} className="text-slate-400" />
                  </div>
                  <p className="mt-4 font-medium text-slate-600">Không tìm thấy mentor phù hợp</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                  </p>
                </div>
              )}

              {/* CTA - Become Mentor (ẩn nếu user đã là mentor) */}
              {!isMentor && (
                <div className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-8 text-white">
                  <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Bạn muốn trở thành Mentor?</h3>
                      <p className="mt-2 text-slate-300">
                        Đăng ký ngay để chia sẻ kiến thức và nhận thu nhập từ việc tư vấn sinh viên.
                      </p>
                    </div>
                    <Link
                      href="/mentor/register"
                      className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-800 shadow-lg transition-all hover:bg-slate-100"
                    >
                      <BookOpen size={20} />
                      Đăng ký làm Mentor
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
