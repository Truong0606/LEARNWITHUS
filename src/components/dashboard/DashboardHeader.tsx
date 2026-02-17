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
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-64 py-2 pl-10 pr-4 text-sm bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <User size={20} className="text-blue-600" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800">
              {user?.userName || 'User'}
            </p>
            <p className="text-xs text-gray-500">{user?.role || 'Role'}</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
}

