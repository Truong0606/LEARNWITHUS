'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page has been merged into /admin/mentors (tab "Yêu cầu đăng ký")
export default function AdminMentorRequestsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/mentors');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="text-gray-500">Đang chuyển hướng...</p>
    </div>
  );
}
