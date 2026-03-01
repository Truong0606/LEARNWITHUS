'use client';

import { useState } from 'react';
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
} from 'lucide-react';

// Mock mentors data - structure inspired by Mentori.vn
const mockMentors = [
  {
    id: 'm1',
    name: 'Nguyễn Minh Tuấn',
    title: 'Senior Developer',
    company: 'FPT Software',
    subject: 'Lập trình Web',
    university: 'ĐH Bách Khoa HN',
    rating: 4.9,
    menteeCount: 48,
    sessionCount: 156,
    pricePerSession: 150000,
    avatar: 'NT',
    bio: '5 năm kinh nghiệm phát triển web. Chuyên React, Node.js, TypeScript. Từng làm việc tại các startup công nghệ.',
    topics: ['Lập trình Web', 'React', 'Node.js', 'TypeScript'],
    availableSlot: '19:00, 02/03/2026',
    isInactive: false,
  },
  {
    id: 'm2',
    name: 'Trần Thị Hương',
    title: 'Giảng viên Toán',
    company: 'ĐH Khoa học Tự nhiên',
    subject: 'Toán rời rạc',
    university: 'ĐH Khoa học Tự nhiên',
    rating: 4.8,
    menteeCount: 32,
    sessionCount: 98,
    pricePerSession: 120000,
    avatar: 'TH',
    bio: 'Thạc sĩ Toán học. Ôn thi cuối kỳ, luyện tư duy logic và giải bài tập.',
    topics: ['Toán rời rạc', 'Ôn thi', 'Tư duy logic'],
    availableSlot: '18:00, 03/03/2026',
    isInactive: true,
  },
  {
    id: 'm3',
    name: 'Lê Văn Đức',
    title: 'Research Scientist',
    company: 'VinAI',
    subject: 'Trí tuệ nhân tạo',
    university: 'ĐH Công nghệ',
    rating: 5.0,
    menteeCount: 24,
    sessionCount: 67,
    pricePerSession: 200000,
    avatar: 'ĐL',
    bio: 'Nghiên cứu sinh AI. Hướng dẫn Machine Learning, Deep Learning, Python.',
    topics: ['AI', 'Machine Learning', 'Deep Learning', 'Python'],
    availableSlot: '14:00, 04/03/2026',
    isInactive: false,
  },
  {
    id: 'm4',
    name: 'Phạm Thu Hà',
    title: 'IELTS Trainer',
    company: 'British Council',
    subject: 'IELTS',
    university: 'ĐH Ngoại ngữ',
    rating: 4.7,
    menteeCount: 56,
    sessionCount: 189,
    pricePerSession: 180000,
    avatar: 'HP',
    bio: 'IELTS 8.5. Chuyên Writing & Speaking. Luyện thi cấp tốc.',
    topics: ['IELTS', 'Writing', 'Speaking', 'Luyện thi'],
    availableSlot: '19:00, 01/03/2026',
    isInactive: false,
  },
  {
    id: 'm5',
    name: 'Hoàng Minh Quân',
    title: 'Database Architect',
    company: 'Viettel Solutions',
    subject: 'Cơ sở dữ liệu',
    university: 'ĐH Bách Khoa',
    rating: 4.9,
    menteeCount: 41,
    sessionCount: 112,
    pricePerSession: 130000,
    avatar: 'QH',
    bio: 'DBA 3 năm. SQL, MongoDB, thiết kế database, tối ưu truy vấn.',
    topics: ['SQL', 'MongoDB', 'Database Design'],
    availableSlot: '18:00, 05/03/2026',
    isInactive: false,
  },
];

const categoryChips = [
  'Finance & Banking',
  'Marketing & Sales',
  'Accounting & Audit',
  'Supply Chain',
  'Human Resources',
  'Management Consulting',
  'Công nghệ thông tin',
  'Giáo dục',
];

const subjectTags = [
  'Lập trình Web',
  'Toán rời rạc',
  'AI',
  'IELTS',
  'Cơ sở dữ liệu',
  'React',
  'Node.js',
  'Machine Learning',
  'Python',
  'Ôn thi',
  'Kỹ năng mềm',
  'Định hướng nghề nghiệp',
];

const topicOptions = [
  'Định hướng và chia sẻ kinh nghiệm nghề nghiệp',
  'Hoạt động ngoại khóa / Học bổng du học / Cuộc thi',
  'Kỹ năng mềm',
  'Chủ đề bất kỳ',
  'Khác',
];

export default function MentorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [mentorBadge, setMentorBadge] = useState('all');

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const filteredMentors = mockMentors.filter((m) => {
    const matchSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCategory = !activeCategory || m.topics.some((t) => t.includes(activeCategory));
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero - Mentori style */}
        <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 py-16 md:py-20">
          <div className="px-4 mx-auto max-w-[1800px] sm:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center">
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Cộng đồng Mentor
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-300 md:text-xl">
              Tiến nhanh và xa hơn trong hành trình học tập cùng StudyHub
            </p>
          </div>
        </section>

        {/* Category chips - horizontal scroll */}
        <section className="border-b border-gray-200 bg-white">
          <div className="px-4 py-4 mx-auto max-w-[1800px] sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categoryChips.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Subject tags */}
        <section className="border-b border-gray-200 bg-white/80">
          <div className="px-4 py-3 mx-auto max-w-[1800px] sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Chủ đề
            </p>
            <div className="flex flex-wrap gap-2">
              {subjectTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery((q) => (q === tag ? '' : tag))}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    searchQuery === tag
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tag}
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
                placeholder="Tìm kiếm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-12 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
        </section>

        {/* Main content - Sidebar + Mentor list */}
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
                      Chọn Chủ đề
                    </label>
                    <select
                      value={activeTopic}
                      onChange={(e) => setActiveTopic(e.target.value)}
                      className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      <option value="">Tất cả</option>
                      {topicOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Lịch rảnh
                    </label>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="min-w-0 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <span className="flex-shrink-0 px-1 text-center text-xs text-slate-400">
                        đến
                      </span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="min-w-0 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Loại Mentor
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'all', label: 'Tất cả Mentor' },
                        { value: 'expert', label: 'Expert' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => setMentorBadge(value)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            mentorBadge === value
                              ? 'bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700">
                    Áp dụng
                  </button>
                </div>
              </div>
            </aside>

            {/* Mentor list */}
            <div className="flex-1 min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-800">
                  Tìm thấy {filteredMentors.length} Mentor cho bạn!
                </h2>
                <button className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-800 lg:hidden">
                  <Filter size={16} />
                  Lọc kết quả
                </button>
              </div>

              <div className="space-y-4">
                {filteredMentors.map((mentor) => (
                  <Link
                    key={mentor.id}
                    href={`/mentors/${mentor.id}`}
                    className="block overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-2xl font-bold text-white">
                        {mentor.avatar}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-800 group-hover:text-slate-600">
                              {mentor.name}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {mentor.title} tại {mentor.company}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar size={14} />
                            <span>Lịch rảnh: {mentor.availableSlot}</span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {mentor.menteeCount} mentee
                          </span>
                          <span>—</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            {mentor.sessionCount}
                          </span>
                        </div>

                        {mentor.isInactive && (
                          <div className="mt-2 inline-block rounded-lg bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            Cố vấn này đã lâu ngày không hoạt động.
                          </div>
                        )}

                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Giới thiệu bản thân
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                            {mentor.bio}
                          </p>
                        </div>

                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Chủ đề Mentoring
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {mentor.topics.slice(0, 4).map((topic) => (
                              <span
                                key={topic}
                                className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                              >
                                {topic}
                              </span>
                            ))}
                            {mentor.topics.length > 4 && (
                              <span className="text-xs text-slate-400">
                                +{mentor.topics.length - 4}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900">
                          Xem chi tiết
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {filteredMentors.length === 0 && (
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

              {/* CTA - Become Mentor */}
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
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
