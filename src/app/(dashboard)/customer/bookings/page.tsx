'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import { Plus, Eye, Calendar, Clock, MapPin } from 'lucide-react';
import { BookingStatusLabels, BookingStatus } from '@/types';

interface Booking {
  id: string;
  bookingCode: string;
  serviceName: string;
  status: BookingStatus;
  appointmentDate: string;
  collectionMethod: 'home' | 'facility';
  price: number;
  createdAt: string;
}

const mockBookings: Booking[] = [
  {
    id: '1',
    bookingCode: 'BK1001',
    serviceName: 'Xét nghiệm ADN Cha Con',
    status: BookingStatus.Pending,
    appointmentDate: '2025-01-10',
    collectionMethod: 'home',
    price: 3500000,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    bookingCode: 'BK1002',
    serviceName: 'Xét nghiệm ADN Pháp lý',
    status: BookingStatus.DepositPaid,
    appointmentDate: '2025-01-08',
    collectionMethod: 'facility',
    price: 5500000,
    createdAt: '2024-12-28',
  },
  {
    id: '3',
    bookingCode: 'BK1003',
    serviceName: 'Xét nghiệm Quan hệ Họ hàng',
    status: BookingStatus.Testing,
    appointmentDate: '2024-12-20',
    collectionMethod: 'home',
    price: 4500000,
    createdAt: '2024-12-15',
  },
  {
    id: '4',
    bookingCode: 'BK1004',
    serviceName: 'Xét nghiệm ADN Cha Con',
    status: BookingStatus.Completed,
    appointmentDate: '2024-12-10',
    collectionMethod: 'facility',
    price: 3500000,
    createdAt: '2024-12-05',
  },
];

const getStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case BookingStatus.Pending:
      return 'bg-yellow-100 text-yellow-700';
    case BookingStatus.DepositPaid:
    case BookingStatus.KitDelivering:
      return 'bg-blue-100 text-blue-700';
    case BookingStatus.Testing:
      return 'bg-purple-100 text-purple-700';
    case BookingStatus.Completed:
      return 'bg-green-100 text-green-700';
    case BookingStatus.Cancelled:
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setBookings(mockBookings);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="large" message="Đang tải danh sách lịch hẹn..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="Lịch xét nghiệm của tôi" />

      <div className="p-6">
        {/* Action Button */}
        <div className="flex justify-end mb-6">
          <Link
            href="/services"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Đặt lịch mới
          </Link>
        </div>

        {/* Bookings List */}
        {bookings.length > 0 ? (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 transition-shadow bg-white rounded-lg shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold text-gray-800">
                        {booking.serviceName}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {BookingStatusLabels[booking.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Mã đơn: <span className="font-medium text-blue-600">{booking.bookingCode}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Ngày hẹn: {formatDate(booking.appointmentDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {booking.collectionMethod === 'home' ? 'Lấy mẫu tại nhà' : 'Lấy mẫu tại cơ sở'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {formatPrice(booking.price)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Tạo ngày {formatDate(booking.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={`/customer/bookings/${booking.id}`}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 transition-colors border border-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      <Eye size={16} />
                      Chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-xl font-semibold text-gray-700">
              Chưa có lịch hẹn nào
            </h3>
            <p className="mb-6 text-gray-500">
              Đặt lịch xét nghiệm ADN ngay hôm nay để được phục vụ tốt nhất
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Đặt lịch ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

