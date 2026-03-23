'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BookOpen,
  CheckCircle,
  GraduationCap, 
  Lock, 
  Mail, 
  MessageSquare,
  Sparkles,
  Timer,
  User, 
  UserPlus,
  Users,
  School
} from 'lucide-react';

const subjectOptions = [
  { id: 'math', name: 'Toán học', color: 'violet' },
  { id: 'programming', name: 'Lập trình', color: 'pink' },
  { id: 'database', name: 'Cơ sở dữ liệu', color: 'emerald' },
  { id: 'ai', name: 'Trí tuệ nhân tạo', color: 'amber' },
  { id: 'economics', name: 'Kinh tế học', color: 'rose' },
  { id: 'english', name: 'Tiếng Anh', color: 'indigo' },
  { id: 'physics', name: 'Vật lý', color: 'cyan' },
  { id: 'chemistry', name: 'Hóa học', color: 'orange' },
];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    university: '',
    password: '',
    confirmPassword: '',
    subjects: [] as string[],
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      router.replace('/');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleSubject = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter((s) => s !== subjectId)
        : [...prev.subjects, subjectId],
    }));
    setErrors((prev) => ({ ...prev, subjects: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.university.trim()) {
      newErrors.university = 'Vui lòng nhập tên trường';
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = 'Vui lòng chọn ít nhất 1 môn học yêu thích';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (!formData.terms) {
      newErrors.terms = 'Vui lòng đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          address: formData.university,
          phone: '0000000000',
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Đăng ký thất bại');
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('email')) {
        setErrors({ email: error.message });
      } else {
        setErrors({ 
          confirmPassword: error instanceof Error ? error.message : 'Đăng ký thất bại' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-md p-8 text-center bg-white rounded-2xl shadow-xl border border-violet-100">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Đăng Ký Thành Công!</h2>
          <p className="mb-6 text-gray-600">
            Chào mừng bạn đến với Learn With Us! 
            Bạn sẽ được chuyển đến trang đăng nhập...
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 rounded-xl hover:shadow-lg transition-all"
          >
            <Sparkles size={18} />
            Bắt đầu học ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Illustration */}
      <div className="relative flex-col items-center justify-center flex-1 hidden p-12 lg:flex bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
        {/* Decorative elements */}
        <div className="absolute w-32 h-32 rounded-full top-10 left-10 bg-white/10 blur-2xl" />
        <div className="absolute w-40 h-40 rounded-full bottom-20 right-10 bg-slate-400/20 blur-3xl" />
        <div className="absolute w-24 h-24 rounded-full top-1/3 right-20 bg-amber-400/20 blur-2xl" />

        <div className="relative z-10 max-w-lg text-center text-white">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm">
                <GraduationCap size={48} className="text-white" />
              </div>
              <div className="absolute flex items-center justify-center w-10 h-10 bg-amber-400 rounded-xl -top-2 -right-2 shadow-lg animate-bounce">
                <Sparkles size={20} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-bold">Tham Gia Learn With Us</h1>
          <p className="mb-8 text-xl text-white/80">
            Bắt đầu hành trình học tập hiệu quả cùng cộng đồng sinh viên
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <Users size={20} />
              </div>
              <span>Tham gia nhóm học theo môn</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <MessageSquare size={20} />
              </div>
              <span>Thảo luận và hỏi đáp trên diễn đàn</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <Timer size={20} />
              </div>
              <span>Tập trung học với Pomodoro</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <BookOpen size={20} />
              </div>
              <span>Được mentor hỗ trợ 1-1</span>
            </div>
          </div>

          {/* Stats */}
          <div className="pt-8 mt-8 border-t border-white/20">
            <div className="flex items-center justify-center gap-8 text-white/90">
              <div className="text-center">
                <span className="block text-3xl font-bold">25K+</span>
                <span className="text-sm text-white/70">Sinh viên</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold">1.2K+</span>
                <span className="text-sm text-white/70">Nhóm học</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold">350+</span>
                <span className="text-sm text-white/70">Mentor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex items-center justify-center flex-1 p-6 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="w-full max-w-lg py-8">
          {/* Mobile Logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
                <GraduationCap size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                Learn With Us
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
              <UserPlus size={28} className="text-slate-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-800">
              Tạo Tài Khoản Học Tập
            </h2>
            <p className="text-gray-600">
              Miễn phí và chỉ mất 1 phút để đăng ký
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                Họ và tên
              </label>
              <div className="relative">
                <User size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn Văn A"
                  className={`w-full py-3 pl-12 pr-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                    errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email & University */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                  Email sinh viên
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@edu.vn"
                    className={`w-full py-3 pl-12 pr-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                  Trường đại học
                </label>
                <div className="relative">
                  <School size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    placeholder="VD: ĐH Bách Khoa"
                    className={`w-full py-3 pl-12 pr-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                      errors.university ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.university && (
                  <p className="mt-1 text-sm text-red-500">{errors.university}</p>
                )}
              </div>
            </div>

            {/* Subject Interests */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Môn học yêu thích
              </label>
              <div className="flex flex-wrap gap-2">
                {subjectOptions.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => toggleSubject(subject.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border-2 transition-all ${
                      formData.subjects.includes(subject.id)
                        ? 'bg-slate-600 text-white border-slate-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-slate-300'
                    }`}
                    disabled={loading}
                  >
                    {formData.subjects.includes(subject.id) && (
                      <CheckCircle size={14} className="inline mr-1" />
                    )}
                    {subject.name}
                  </button>
                ))}
              </div>
              {errors.subjects && (
                <p className="mt-1 text-sm text-red-500">{errors.subjects}</p>
              )}
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tối thiểu 6 ký tự"
                    className={`w-full py-3 pl-12 pr-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                      errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    className={`w-full py-3 pl-12 pr-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                      errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="w-5 h-5 mt-0.5 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-600">
                  Tôi đồng ý với{' '}
                  <a href="#" className="font-medium text-slate-600 hover:underline">
                    Điều khoản sử dụng
                  </a>{' '}
                  và{' '}
                  <a href="#" className="font-medium text-slate-600 hover:underline">
                    Chính sách bảo mật
                  </a>{' '}
                  của Learn With Us
                </span>
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-500">{errors.terms}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 text-base font-semibold text-white transition-all bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang tạo tài khoản...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={18} />
                  Tạo Tài Khoản Miễn Phí
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link
                href="/login"
                className="font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
            <p className="mt-3 text-sm text-gray-600">
              <Link
                href="/"
                className="font-medium text-gray-500 hover:text-slate-600 transition-colors"
              >
                ← Quay lại trang chủ
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
