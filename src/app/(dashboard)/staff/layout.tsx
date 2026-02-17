'use client';

import { Sidebar } from '@/components/dashboard';
import { TestTube, Building2, FileCheck, Truck } from 'lucide-react';

const staffSidebarItems = [
  {
    icon: TestTube,
    heading: 'Quản lí mẫu xét nghiệm',
    href: '/staff/test-sample',
  },
  {
    icon: Building2,
    heading: 'Quản lí mẫu tại cơ sở',
    href: '/staff/test-sample-facility',
  },
  {
    icon: FileCheck,
    heading: 'Quản lí kết quả xét nghiệm',
    href: '/staff/test-result',
  },
  {
    icon: Truck,
    heading: 'Quản lí giao - nhận TestKit',
    href: '/staff/delivery',
  },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar items={staffSidebarItems} title="Staff Panel" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

