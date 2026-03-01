'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Crown, GraduationCap, LogOut, Menu, User, X, BookOpen, Users } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/about', label: 'Giới thiệu' },
  { href: '/community', label: 'Cộng đồng' },
  { href: '/groups', label: 'Nhóm học' },
  { href: '/pomodoro', label: 'Pomodoro' },
  { href: '/mentors', label: 'Mentor' },
  { href: '/upgrade', label: 'VIP' },
];

interface UserInfo {
  userName: string;
  role: string;
  userId: string;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        setIsLoggedIn(true);
        setUserInfo(user);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [pathname]);

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
    setIsAvatarOpen(false);
    router.push('/');
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

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
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white font-semibold text-sm cursor-pointer hover:shadow-lg hover:shadow-slate-200 transition-all">
                    {getInitials(userInfo.userName)}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isAvatarOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{userInfo.userName}</p>
                      <p className="text-xs text-gray-500">{userInfo.role}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
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
                        href="/mentor/dashboard"
                        onClick={() => setIsAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      >
                        <BookOpen size={18} />
                        Dashboard Mentor
                      </Link>
                      <Link
                        href="/upgrade"
                        onClick={() => setIsAvatarOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                      >
                        <Crown size={18} />
                        Nâng cấp VIP
                      </Link>
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
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white font-semibold text-xs">
                      {getInitials(userInfo.userName)}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {userInfo.userName}
                    </span>
                  </div>
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
                    <BookOpen size={18} />
                    Không gian học
                  </Link>
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
