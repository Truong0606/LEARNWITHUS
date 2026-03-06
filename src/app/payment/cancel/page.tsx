'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

function PaymentCancelContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get('bookingId');
  const mentorBookingId = searchParams.get('mentorBookingId');
  const type = searchParams.get('type');

  const isMentorPayment = type === 'mentor_booking' || !!mentorBookingId;

  // Nếu có mentorBookingId, cho phép thử lại bằng cách quay về trang tạo payment
  const retryAction = isMentorPayment
    ? null  // sẽ gọi API pay lại từ trang mentor dashboard
    : null;

  const backPath = isMentorPayment ? '/mentor/dashboard' : '/customer/bookings';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <XCircle className="text-red-400" size={64} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán bị hủy</h1>
        <p className="text-gray-500 mb-6">
          Bạn đã hủy thanh toán. Đơn đặt lịch của bạn vẫn đang chờ xác nhận.
          {isMentorPayment
            ? ' Bạn có thể thanh toán lại từ trang quản lý lịch mentor.'
            : ' Bạn có thể thử thanh toán lại từ trang đơn đặt lịch.'}
        </p>

        {(bookingId || mentorBookingId) && (
          <p className="text-sm text-gray-400 mb-6">
            Mã đơn:{' '}
            <span className="font-mono font-medium text-gray-600">
              {mentorBookingId || bookingId}
            </span>
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href={backPath}
            className="inline-block w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {isMentorPayment ? 'Về trang lịch mentor' : 'Về trang đơn đặt lịch'}
          </Link>
          <Link
            href="/"
            className="inline-block w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}
