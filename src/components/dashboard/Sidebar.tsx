'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

interface SidebarItem {
  icon: LucideIcon;
  heading: string;
  href: string;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  title?: string;
}

export default function Sidebar({ items, title = 'StudyHub Admin' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<Record<string, boolean>>({});

  const toggleDropdown = (heading: string) => {
    setOpenDropdown((prev) => ({
      ...prev,
      [heading]: !prev[heading],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('accountId');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex flex-col h-screen w-64 bg-[#1F2B6C] shadow-lg">
      {/* Logo */}
      <div className="flex flex-col items-center py-6">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
          <GraduationCap size={28} className="text-white" />
        </div>
        <span className="text-2xl font-bold text-center text-white">{title}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-6 overflow-y-auto scrollbar-hide">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.heading}>
              {item.children ? (
                <>
                  <div
                    onClick={() => toggleDropdown(item.heading)}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-white font-bold text-[#1F2B6C]'
                        : 'text-white hover:bg-white hover:text-[#1F2B6C]'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="mr-3 text-lg">
                        <item.icon size={20} />
                      </div>
                      {item.heading}
                    </div>
                    {openDropdown[item.heading] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>
                  {openDropdown[item.heading] && (
                    <ul className="mt-1 ml-2 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.heading}>
                          <Link href={child.href}>
                            <div
                              className={`flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                isActive(child.href)
                                  ? 'bg-white font-bold text-[#1F2B6C]'
                                  : 'text-white hover:bg-white hover:text-[#1F2B6C]'
                              }`}
                            >
                              <div className="mr-3 text-lg">
                                <child.icon size={18} />
                              </div>
                              {child.heading}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link href={item.href}>
                  <div
                    className={`flex cursor-pointer items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-white font-bold text-[#1F2B6C]'
                        : 'text-white hover:bg-white hover:text-[#1F2B6C]'
                    }`}
                  >
                    <div className="mr-3 text-lg">
                      <item.icon size={20} />
                    </div>
                    {item.heading}
                  </div>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-4 py-2 text-sm font-medium text-[#1F2B6C] bg-white hover:bg-gray-100 transition-colors"
        >
          <LogOut size={18} className="mr-3" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

