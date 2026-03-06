'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle, Crown, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Hàng tháng',
  quarterly: '3 tháng',
  yearly: '1 năm',
};

type ConfirmStatus = 'loading' | 'success' | 'error';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const type = searchParams.get('type');
  const bookingId = searchParams.get('bookingId');
  const mentorBookingId = searchParams.get('mentorBookingId');
  const planId = searchParams.get('planId');
  // PayOS appends orderCode to the returnUrl
  const orderCode = searchParams.get('orderCode');

  const isVipUpgrade = type === 'vip_upgrade';
  const isMentorPayment = type === 'mentor_booking' || !!mentorBookingId;

  const redirectPath = isVipUpgrade
    ? '/profile'
    : isMentorPayment
    ? '/mentor/dashboard'
    : '/customer/bookings';

  const callConfirm = useCallback(async () => {
    setConfirmStatus('loading');
    setErrorMessage('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setConfirmStatus('error');
        setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      if (!orderCode) {
        // No orderCode in URL — just show success UI (e.g. free VIP session)
        setConfirmStatus('success');
        return;
      }

      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderCode }),
      });

      const json = await res.json();

      if (res.ok && json.data?.confirmed) {
        setConfirmStatus('success');
      } else {
        setConfirmStatus('error');
        setErrorMessage(json.message || 'Không thể xác nhận thanh toán.');
      }
    } catch {
      setConfirmStatus('error');
      setErrorMessage('Lỗi kết nối. Vui lòng thử lại.');
    }
  }, [orderCode]);

  // Call confirm on mount
  useEffect(() => {
    callConfirm();
  }, [callConfirm]);

  // Countdown only starts after payment is confirmed
  useEffect(() => {
    if (confirmStatus !== 'success') return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push(redirectPath);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [confirmStatus, router, redirectPath]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (confirmStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <Loader2 className="animate-spin text-blue-500" size={64} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Đang xác nhận thanh toán...</h1>
          <p className="text-gray-500">Vui lòng không đóng trang này.</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (confirmStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <AlertCircle className="text-red-500" size={64} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Xác nhận thất bại</h1>
          <p className="text-gray-500 mb-6">{errorMessage}</p>
          <button
            onClick={callConfirm}
            className="inline-flex items-center gap-2 w-full justify-center py-3 px-6 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors mb-3"
          >
            <RefreshCw size={16} />
            Thử lại
          </button>
          <Link
            href={redirectPath}
            className="inline-block w-full py-3 px-6 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Bỏ qua, về trang chính
          </Link>
        </div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {isVipUpgrade ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <Crown className="text-amber-500" size={44} strokeWidth={1.5} />
            </div>
          ) : (
            <CheckCircle className="text-green-500" size={64} strokeWidth={1.5} />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {isVipUpgrade ? 'Chào mừng bạn đến với VIP!' : 'Thanh toán thành công!'}
        </h1>

        {/* Message */}
        <p className="text-gray-500 mb-6">
          {isVipUpgrade
            ? `Gói VIP ${planId ? PLAN_LABELS[planId] ?? planId : ''} đã được kích hoạt. Tận hưởng các quyền lợi đặc biệt ngay bây giờ.`
            : isMentorPayment
            ? 'Đặt lịch mentor của bạn đã được xác nhận.'
            : type === 'deposit'
            ? 'Đặt cọc thành công. Chúng tôi sẽ liên hệ để giao kit xét nghiệm.'
            : 'Thanh toán hoàn tất. Bạn có thể xem kết quả xét nghiệm ngay bây giờ.'}
        </p>

        {/* Order ref */}
        {(bookingId || mentorBookingId) && (
          <p className="text-sm text-gray-400 mb-6">
            Mã đơn:{' '}
            <span className="font-mono font-medium text-gray-600">
              {mentorBookingId || bookingId}
            </span>
          </p>
        )}

        {/* CTA */}
        <Link
          href={redirectPath}
          className={`inline-block w-full py-3 px-6 rounded-xl font-semibold text-white transition-colors ${
            isVipUpgrade
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isVipUpgrade
            ? 'Xem profile VIP của tôi'
            : isMentorPayment
            ? 'Xem lịch mentor của tôi'
            : 'Xem đơn đặt lịch'}
        </Link>

        <p className="text-sm text-gray-400 mt-4">
          Tự động chuyển hướng sau{' '}
          <span className="font-semibold text-gray-600">{countdown}s</span>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
