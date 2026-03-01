'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  GraduationCap, 
  Unlock, 
  ArrowLeft,
  CheckCircle,
  KeyRound,
  Sparkles
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrors({ email: 'Vui lòng nhập email' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Email không hợp lệ' });
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể gửi email');
      }

      setStep('otp');
    } catch (error) {
      setErrors({ 
        email: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!otpCode || otpCode.length !== 6) {
      newErrors.otp = 'Vui lòng nhập mã OTP 6 số';
    }
    if (!newPassword || newPassword.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể đặt lại mật khẩu');
      }

      setStep('success');
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setErrors({ 
        otp: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-md p-8 text-center bg-white rounded-2xl shadow-xl border border-violet-100">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Đặt Lại Mật Khẩu Thành Công!</h2>
          <p className="mb-6 text-gray-600">
            Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng đến trang đăng nhập sau {countdown} giây...
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl hover:shadow-lg transition-all"
          >
            <Sparkles size={18} />
            Đăng nhập ngay
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

        <div className="relative z-10 max-w-lg text-center text-white">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm">
                <GraduationCap size={48} className="text-white" />
              </div>
              <div className="absolute flex items-center justify-center w-10 h-10 bg-amber-400 rounded-xl -top-2 -right-2 shadow-lg">
                <KeyRound size={20} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-bold">Khôi Phục Tài Khoản</h1>
          <p className="text-xl text-white/80">
            Đừng lo, chúng tôi sẽ giúp bạn lấy lại mật khẩu để tiếp tục học tập
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center flex-1 p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800">
                <GraduationCap size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                StudyHub
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
              <Unlock size={28} className="text-slate-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-800">
              {step === 'email' ? 'Quên Mật Khẩu?' : 'Xác Nhận OTP'}
            </h2>
            <p className="text-gray-600">
              {step === 'email' 
                ? 'Nhập email để nhận mã khôi phục' 
                : `Chúng tôi đã gửi mã OTP đến ${email}`}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Email sinh viên
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({});
                    }}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-base font-semibold text-white transition-all bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang gửi...
                  </span>
                ) : (
                  'Gửi Mã Khôi Phục'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Mã OTP (6 số)
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(val);
                    setErrors((prev) => ({ ...prev, otp: '' }));
                  }}
                  placeholder="Nhập mã 6 số"
                  className={`w-full py-3.5 px-4 text-center text-2xl tracking-widest border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                    errors.otp ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                  maxLength={6}
                  disabled={loading}
                />
                {errors.otp && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.otp}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="Tối thiểu 6 ký tự"
                  className={`w-full py-3.5 px-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
                  }`}
                  disabled={loading}
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-base font-semibold text-white transition-all bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  'Đặt Lại Mật Khẩu'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full py-3 text-sm font-medium text-gray-600 hover:text-slate-600 transition-colors"
              >
                ← Quay lại nhập email khác
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
