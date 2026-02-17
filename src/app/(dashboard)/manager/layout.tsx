'use client';

import { Sidebar } from '@/components/dashboard';
import { 
  BarChart3, 
  ClipboardList, 
  Settings, 
  Truck, 
  Tag, 
  FileText, 
  Star,
  CreditCard 
} from 'lucide-react';

const managerSidebarItems = [
  {
    icon: BarChart3,
    heading: 'Quản lí doanh thu',
    href: '/manager/dashboard',
  },
  {
    icon: ClipboardList,
    heading: 'Quản lí đơn xét nghiệm',
    href: '/manager/bookings',
  },
  {
    icon: Settings,
    heading: 'Quản lí dịch vụ',
    href: '/manager/services',
  },
  {
    icon: Truck,
    heading: 'Quản lý giao - nhận TestKit',
    href: '/manager/delivery',
  },
  {
    icon: Tag,
    heading: 'Quản lí thẻ bài viết',
    href: '/manager/tags',
  },
  {
    icon: FileText,
    heading: 'Quản lí bài viết',
    href: '/manager/blogs',
  },
  {
    icon: Star,
    heading: 'Các đánh giá',
    href: '/manager/feedback',
  },
  {
    icon: CreditCard,
    heading: 'Quản lí lịch sử thanh toán',
    href: '/manager/payments',
  },
];

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar items={managerSidebarItems} title="Manager Panel" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

