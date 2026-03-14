'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Crown, GraduationCap, LogOut, Menu, User, X, BookOpen, Users, Shield, CalendarDays } from 'lucide-react';

const baseNavLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/about', label: 'Giới thiệu' },
  { href: '/community', label: 'Cộng đồng' },
  { href: '/groups', label: 'Nhóm học' },
  { href: '/pomodoro', label: 'Pomodoro' },
  { href: '/mentors', label: 'Mentor' },
  { href: '/upgrade', label: 'VIP', vipOnly: false }, // ẩn khi user đã là VIP
];

interface UserInfo {
  userName: string;
  role: string;
  userId: string;
  avatarUrl?: string;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isVip, setIsVip] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const avatarRef = useRef<HTMLDivElement>(null);

  const loadUserFromStorage = useCallback(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        setIsLoggedIn(true);
        setUserInfo(user);
        return token;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      setIsLoggedIn(false);
      setUserInfo(null);
      setIsVip(false);
    }
    return null;
  }, []);

  // Kiểm tra VIP status từ API
  const checkVipStatus = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/upgrade', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setIsVip(json.data?.isVip === true);
      }
    } catch {
      // Bỏ qua nếu lỗi
    }
  }, []);

  useEffect(() => {
    const token = loadUserFromStorage();
    if (token) checkVipStatus(token);
  }, [pathname, loadUserFromStorage, checkVipStatus]);

  useEffect(() => {
    const handleStorageOrEvent = () => {
      const token = loadUserFromStorage();
      if (token) checkVipStatus(token);
    };
    window.addEventListener('storage', handleStorageOrEvent);
    window.addEventListener('user-avatar-updated', handleStorageOrEvent);
    return () => {
      window.removeEventListener('storage', handleStorageOrEvent);
      window.removeEventListener('user-avatar-updated', handleStorageOrEvent);
    };
  }, [loadUserFromStorage, checkVipStatus]);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserInfo(null);
    setIsVip(false);
    setIsAvatarOpen(false);
    router.push('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Ẩn link "VIP" khi user đã là VIP
  const navLinks = baseNavLinks.filter(
    (link) => !(link.href === '/upgrade' && isLoggedIn && isVip)
  );

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg shadow-slate-200">
              <GraduationCap size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              StudyHub
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-slate-700 ${
                  pathname === link.href || pathname?.startsWith(link.href + '/')
                    ? 'text-slate-700'
                    : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn && userInfo ? (
              <div className="relative" ref={avatarRef}>
                {/* Avatar Button */}
                <button
                  onClick={() => setIsAvatarOpen(!isAvatarOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                  aria-label="Menu tài khoản"
                  aria-expanded={isAvatarOpen}
                >
                  <span className="text-sm text-gray-600 hidden lg:block">
                    {userInfo.userName}
                  </span>
                  {/* Avatar với ring vàng nếu VIP */}
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white font-semibold text-sm cursor-pointer hover:shadow-lg transition-all overflow-hidden ${isVip ? 'ring-2 ring-amber-400 ring-offset-1' : 'hover:shadow-slate-200'}`}>
                    {userInfo.avatarUrl ? (
                      <img src={userInfo.avatarUrl} alt={userInfo.userName} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(userInfo.userName)
                    )}
                    {isVip && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px]">
                        👑
                      </span>
                    )}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isAvatarOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{userInfo.userName}</p>
                        {isVip && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <Crown size={10} />
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{userInfo.role}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {userInfo.role === 'Admin' && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                          <Shield size={18} />
                          Trang quản trị
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        onClick={() => setIsAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      >
                        <User size={18} />
                        Hồ sơ cá nhân
                      </Link>
                      <Link
                        href="/groups"
                        onClick={() => setIsAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      >
                        <Users size={18} />
                        Không gian học
                      </Link>
                      <Link
                        href="/schedule"
                        onClick={() => setIsAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      >
                        <CalendarDays size={18} />
                        Lịch học
                      </Link>
                      {userInfo.role === 'Mentor' ? (
                        <Link
                          href="/mentor/dashboard"
                          onClick={() => setIsAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                          <BookOpen size={18} />
                          Dashboard Mentor
                        </Link>
                      ) : (
                        <Link
                          href="/mentor/register"
                          onClick={() => setIsAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                        >
                          <BookOpen size={18} />
                          Đăng ký Mentor
                        </Link>
                      )}

                      {/* Ẩn "Nâng cấp VIP" khi đã là VIP */}
                      {!isVip && (
                        <Link
                          href="/upgrade"
                          onClick={() => setIsAvatarOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Crown size={18} />
                          Nâng cấp VIP
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white transition-all bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl hover:shadow-lg hover:shadow-slate-200 hover:-translate-y-0.5"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    pathname === link.href || pathname?.startsWith(link.href + '/')
                      ? 'bg-slate-100 text-slate-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-slate-200" />
              {isLoggedIn && userInfo ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white font-semibold text-xs overflow-hidden ${isVip ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
                      {userInfo.avatarUrl ? (
                        <Image src={userInfo.avatarUrl} alt={userInfo.userName} width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(userInfo.userName)
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">
                        {userInfo.userName}
                      </span>
                      {isVip && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Crown size={9} />
                          VIP
                        </span>
                      )}
                    </div>
                  </div>
                  {userInfo.role === 'Admin' && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-slate-700 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield size={18} />
                      Trang quản trị
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-slate-700 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} />
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/groups"
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-slate-700 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Users size={18} />
                    Không gian học
                  </Link>
                  <Link
                    href="/schedule"
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-slate-700 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <CalendarDays size={18} />
                    Lịch học
                  </Link>
                  {!isVip && (
                    <Link
                      href="/upgrade"
                      className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Crown size={18} />
                      Nâng cấp VIP
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-left text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={18} />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-semibold text-center text-white bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
