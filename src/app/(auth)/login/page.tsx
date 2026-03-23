'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { 
  BookOpen, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Lock, 
  Mail, 
  MessageSquare, 
  Sparkles,
  Timer, 
  Users,
  Hash,
  Copy,
  Check,
} from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();

  // Hash generator for Firestore passwordHash (dev tool)
  const [hashInput, setHashInput] = useState('123456');
  const [hashResult, setHashResult] = useState<string | null>(null);
  const [hashLoading, setHashLoading] = useState(false);
  const [hashCopied, setHashCopied] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const parsed = JSON.parse(user) as { role?: string };
        // role 1 = Admin: redirect to admin dashboard
        if (parsed.role === 'Admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/');
        }
      } catch {
        router.replace('/');
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email) {
      newErrors.email = 'Vui lÃ²ng nháº­p email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email khÃ´ng há»£p lá»‡';
    }
    if (!formData.password) {
      newErrors.password = 'Vui lÃ²ng nháº­p máº­t kháº©u';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'ÄÄƒng nháº­p tháº¥t báº¡i');
      }

      const loginData = data.data;

      localStorage.setItem('token', loginData.token);
      localStorage.setItem('user', JSON.stringify({
        userName: loginData.userName,
        role: loginData.role,
        userId: loginData.userId,
        avatarUrl: loginData.avatarUrl,
      }));

      // role 1 = Admin: redirect to admin dashboard
      if (loginData.role === 'Admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (error) {
      setErrors({
        password: error instanceof Error ? error.message : 'ÄÄƒng nháº­p tháº¥t báº¡i',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHash = async () => {
    setHashLoading(true);
    setHashResult(null);
    try {
      const hash = await bcrypt.hash(hashInput, 10);
      setHashResult(hash);
    } catch {
      setHashResult('Lá»—i táº¡o hash');
    } finally {
      setHashLoading(false);
    }
  };

  const handleCopyHash = async () => {
    if (!hashResult) return;
    try {
      await navigator.clipboard.writeText(hashResult);
      setHashCopied(true);
      setTimeout(() => setHashCopied(false), 2000);
    } catch {
      setHashResult(null);
    }
  };

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
              <div className="absolute flex items-center justify-center w-10 h-10 bg-amber-400 rounded-xl -top-2 -right-2 shadow-lg">
                <Sparkles size={20} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-bold">ChÃ o má»«ng trá»Ÿ láº¡i!</h1>
          <p className="mb-8 text-xl text-white/80">
            Tiáº¿p tá»¥c hÃ nh trÃ¬nh há»c táº­p cÃ¹ng cá»™ng Ä‘á»“ng sinh viÃªn
          </p>

          {/* Features */}
          <div className="pt-8 mt-8 space-y-4 border-t border-white/20">
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <Users size={20} />
              </div>
              <span>Káº¿t ná»‘i vá»›i 25.000+ sinh viÃªn</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <BookOpen size={20} />
              </div>
              <span>Tham gia 1.200+ nhÃ³m há»c</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <Timer size={20} />
              </div>
              <span>TÄƒng nÄƒng suáº¥t vá»›i Pomodoro</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <MessageSquare size={20} />
              </div>
              <span>Tháº£o luáº­n trÃªn diá»…n Ä‘Ã n há»c táº­p</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center flex-1 p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800">
                <GraduationCap size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                Learn With Us
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
              <Lock size={28} className="text-slate-600" />
            </div>
            <h2 className="mb-2 text-3xl font-bold text-gray-800">ÄÄƒng Nháº­p</h2>
            <p className="text-gray-600">
              Truy cáº­p vÃ o khÃ´ng gian há»c táº­p cá»§a báº¡n
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Email sinh viÃªn
              </label>
              <div className="relative">
                <Mail size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@university.edu.vn"
                  className={`w-full py-3.5 pl-12 pr-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Máº­t kháº©u
              </label>
              <div className="relative">
                <Lock size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nháº­p máº­t kháº©u cá»§a báº¡n"
                  className={`w-full py-3.5 pl-12 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute text-gray-400 transform -translate-y-1/2 right-4 top-1/2 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                />
                <span className="text-sm text-gray-600">Ghi nhá»› Ä‘Äƒng nháº­p</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                QuÃªn máº­t kháº©u?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-base font-semibold text-white transition-all bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-slate-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Äang Ä‘Äƒng nháº­p...
                </span>
              ) : (
                'ÄÄƒng Nháº­p'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ChÆ°a cÃ³ tÃ i khoáº£n?{' '}
              <Link
                href="/register"
                className="font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                ÄÄƒng kÃ½ miá»…n phÃ­
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

