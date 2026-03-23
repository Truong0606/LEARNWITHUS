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
  { id: 'math', name: 'ToÃ¡n há»c', color: 'violet' },
  { id: 'programming', name: 'Láº­p trÃ¬nh', color: 'pink' },
  { id: 'database', name: 'CÆ¡ sá»Ÿ dá»¯ liá»‡u', color: 'emerald' },
  { id: 'ai', name: 'TrÃ­ tuá»‡ nhÃ¢n táº¡o', color: 'amber' },
  { id: 'economics', name: 'Kinh táº¿ há»c', color: 'rose' },
  { id: 'english', name: 'Tiáº¿ng Anh', color: 'indigo' },
  { id: 'physics', name: 'Váº­t lÃ½', color: 'cyan' },
  { id: 'chemistry', name: 'HÃ³a há»c', color: 'orange' },
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
      newErrors.fullName = 'Vui lÃ²ng nháº­p há» tÃªn';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Há» tÃªn pháº£i cÃ³ Ã­t nháº¥t 2 kÃ½ tá»±';
    }

    if (!formData.email) {
      newErrors.email = 'Vui lÃ²ng nháº­p email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email khÃ´ng há»£p lá»‡';
    }

    if (!formData.university.trim()) {
      newErrors.university = 'Vui lÃ²ng nháº­p tÃªn trÆ°á»ng';
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = 'Vui lÃ²ng chá»n Ã­t nháº¥t 1 mÃ´n há»c yÃªu thÃ­ch';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lÃ²ng nháº­p máº­t kháº©u';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Máº­t kháº©u pháº£i cÃ³ Ã­t nháº¥t 6 kÃ½ tá»±';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lÃ²ng xÃ¡c nháº­n máº­t kháº©u';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Máº­t kháº©u khÃ´ng khá»›p';
    }

    if (!formData.terms) {
      newErrors.terms = 'Vui lÃ²ng Ä‘á»“ng Ã½ vá»›i Ä‘iá»u khoáº£n sá»­ dá»¥ng';
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
        throw new Error(data.message || data.error || 'ÄÄƒng kÃ½ tháº¥t báº¡i');
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
          confirmPassword: error instanceof Error ? error.message : 'ÄÄƒng kÃ½ tháº¥t báº¡i' 
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
          <h2 className="mb-4 text-2xl font-bold text-gray-800">ÄÄƒng KÃ½ ThÃ nh CÃ´ng!</h2>
          <p className="mb-6 text-gray-600">
            ChÃ o má»«ng báº¡n Ä‘áº¿n vá»›i Learn With Us! 
            Báº¡n sáº½ Ä‘Æ°á»£c chuyá»ƒn Ä‘áº¿n trang Ä‘Äƒng nháº­p...
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 rounded-xl hover:shadow-lg transition-all"
          >
            <Sparkles size={18} />
            Báº¯t Ä‘áº§u há»c ngay
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
            Báº¯t Ä‘áº§u hÃ nh trÃ¬nh há»c táº­p hiá»‡u quáº£ cÃ¹ng cá»™ng Ä‘á»“ng sinh viÃªn
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <Users size={20} />
              </div>
              <span>Tham gia nhÃ³m há»c theo mÃ´n</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <MessageSquare size={20} />
              </div>
              <span>Tháº£o luáº­n vÃ  há»i Ä‘Ã¡p trÃªn diá»…n Ä‘Ã n</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <Timer size={20} />
              </div>
              <span>Táº­p trung há»c vá»›i Pomodoro</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <BookOpen size={20} />
              </div>
              <span>ÄÆ°á»£c mentor há»— trá»£ 1-1</span>
            </div>
          </div>

          {/* Stats */}
          <div className="pt-8 mt-8 border-t border-white/20">
            <div className="flex items-center justify-center gap-8 text-white/90">
              <div className="text-center">
                <span className="block text-3xl font-bold">25K+</span>
                <span className="text-sm text-white/70">Sinh viÃªn</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-bold">1.2K+</span>
                <span className="text-sm text-white/70">NhÃ³m há»c</span>
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
              Táº¡o TÃ i Khoáº£n Há»c Táº­p
            </h2>
            <p className="text-gray-600">
              Miá»…n phÃ­ vÃ  chá»‰ máº¥t 1 phÃºt Ä‘á»ƒ Ä‘Äƒng kÃ½
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-700">
                Há» vÃ  tÃªn
              </label>
              <div className="relative">
                <User size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="VD: Nguyá»…n VÄƒn A"
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
                  Email sinh viÃªn
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
                  TrÆ°á»ng Ä‘áº¡i há»c
                </label>
                <div className="relative">
                  <School size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    placeholder="VD: ÄH BÃ¡ch Khoa"
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
                MÃ´n há»c yÃªu thÃ­ch
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
                  Máº­t kháº©u
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tá»‘i thiá»ƒu 6 kÃ½ tá»±"
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
                  XÃ¡c nháº­n máº­t kháº©u
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nháº­p láº¡i máº­t kháº©u"
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
                  TÃ´i Ä‘á»“ng Ã½ vá»›i{' '}
                  <a href="#" className="font-medium text-slate-600 hover:underline">
                    Äiá»u khoáº£n sá»­ dá»¥ng
                  </a>{' '}
                  vÃ {' '}
                  <a href="#" className="font-medium text-slate-600 hover:underline">
                    ChÃ­nh sÃ¡ch báº£o máº­t
                  </a>{' '}
                  cá»§a Learn With Us
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
                  Äang táº¡o tÃ i khoáº£n...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={18} />
                  Táº¡o TÃ i Khoáº£n Miá»…n PhÃ­
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ÄÃ£ cÃ³ tÃ i khoáº£n?{' '}
              <Link
                href="/login"
                className="font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                ÄÄƒng nháº­p ngay
              </Link>
            </p>
            <p className="mt-3 text-sm text-gray-600">
              <Link
                href="/"
                className="font-medium text-gray-500 hover:text-slate-600 transition-colors"
              >
                â† Quay láº¡i trang chá»§
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

