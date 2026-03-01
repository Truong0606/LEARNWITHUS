'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, User, ChevronDown } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  const [user, setUser] = useState<{ userName: string; role: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // ignore parse error
      }
    }
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
      <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">{title}</h1>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-56 rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        {/* User Menu */}
        <div className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-sm font-semibold text-white">
            {user?.userName ? getInitials(user.userName) : <User size={20} />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-800">
              {user?.userName || 'Admin'}
            </p>
            <p className="text-xs text-gray-500">{user?.role || 'Quản trị'}</p>
          </div>
          <ChevronDown size={16} className="hidden text-gray-400 sm:block" />
        </div>
      </div>
    </header>
  );
}

