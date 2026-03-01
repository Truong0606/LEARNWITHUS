'use client';

import { Sidebar } from '@/components/dashboard';
import { BarChart3, Users, BookOpen, MessageSquare, GraduationCap } from 'lucide-react';

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
    icon: GraduationCap,
    heading: 'Yêu cầu Mentor',
    href: '/admin/mentor-requests',
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar items={adminSidebarItems} title="StudyHub Admin" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

