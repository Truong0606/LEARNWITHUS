'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard';
import { BarChart3, Users, BookOpen, MessageSquare, GraduationCap, DollarSign, CalendarCheck, UserCheck } from 'lucide-react';

const adminSidebarItems = [
  {
    icon: BarChart3,
    heading: 'Tổng quan',
    href: '/admin/dashboard',
  },
  {
    icon: Users,
    heading: 'Quản lý sinh viên',
    href: '/admin/users',
  },
  {
    icon: BookOpen,
    heading: 'Quản lý nhóm học',
    href: '/admin/groups',
  },
  {
    icon: MessageSquare,
    heading: 'Quản lý bài viết',
    href: '/admin/posts',
  },
  {
    icon: UserCheck,
    heading: 'Quản lý Mentor',
    href: '/admin/mentors',
  },
  {
    icon: CalendarCheck,
    heading: 'Đơn đặt lịch Mentor',
    href: '/admin/mentor-bookings',
  },
  {
    icon: DollarSign,
    heading: 'Quản lý doanh thu',
    href: '/admin/revenue',
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!token || !userStr) {
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr) as { role?: string };
      // Only role 1 (Admin) can access admin panel
      if (user.role === 'Admin') {
        setIsAuthorized(true);
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar items={adminSidebarItems} title="Learn With Us Admin" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
