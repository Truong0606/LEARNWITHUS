'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard';
import { BarChart3, Users, BookOpen, MessageSquare, GraduationCap, DollarSign, CalendarCheck, UserCheck } from 'lucide-react';

const adminSidebarItems = [
  {
    icon: BarChart3,
    heading: 'Tá»•ng quan',
    href: '/admin/dashboard',
  },
  {
    icon: Users,
    heading: 'Quáº£n lÃ½ sinh viÃªn',
    href: '/admin/users',
  },
  {
    icon: BookOpen,
    heading: 'Quáº£n lÃ½ nhÃ³m há»c',
    href: '/admin/groups',
  },
  {
    icon: MessageSquare,
    heading: 'Quáº£n lÃ½ bÃ i viáº¿t',
    href: '/admin/posts',
  },
  {
    icon: UserCheck,
    heading: 'Quáº£n lÃ½ Mentor',
    href: '/admin/mentors',
  },
  {
    icon: CalendarCheck,
    heading: 'ÄÆ¡n Ä‘áº·t lá»‹ch Mentor',
    href: '/admin/mentor-bookings',
  },
  {
    icon: DollarSign,
    heading: 'Quáº£n lÃ½ doanh thu',
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


