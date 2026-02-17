// PUT /api/bookings/[id]/status - Update booking status (Staff/Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { TestBooking, ApiResponse, BookingStatus, User, TestService } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.Pending]: [BookingStatus.DepositPaid, BookingStatus.Cancelled],
  [BookingStatus.DepositPaid]: [BookingStatus.KitDelivering, BookingStatus.Cancelled],
  [BookingStatus.KitDelivering]: [BookingStatus.KitDelivered, BookingStatus.Cancelled],
  [BookingStatus.KitDelivered]: [BookingStatus.SampleCollected, BookingStatus.Cancelled],
  [BookingStatus.SampleCollected]: [BookingStatus.SampleDelivering, BookingStatus.Cancelled],
  [BookingStatus.SampleDelivering]: [BookingStatus.SampleReceived, BookingStatus.Cancelled],
  [BookingStatus.SampleReceived]: [BookingStatus.Testing, BookingStatus.Cancelled],
  [BookingStatus.Testing]: [BookingStatus.ResultReady, BookingStatus.Cancelled],
  [BookingStatus.ResultReady]: [BookingStatus.FullyPaid, BookingStatus.Cancelled],
  [BookingStatus.FullyPaid]: [BookingStatus.Completed],
  [BookingStatus.Completed]: [],
  [BookingStatus.Cancelled]: []
};

// PUT - Update booking status
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    // Only Staff, Manager, Admin can update status
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: { status: BookingStatus } = await request.json();

    if (!body.status) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Trạng thái không được để trống', statusCode: 400 },
        { status: 400 }
      );
    }

    // Get booking
    const bookingDoc = await adminDb.collection(COLLECTIONS.testBookings).doc(id).get();

    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as TestBooking;
    const currentStatus = booking.status;
    const newStatus = body.status;

    // Validate status transition
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json<ApiResponse<null>>(
        { 
          data: null, 
          message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${newStatus}`, 
          statusCode: 400 
        },
        { status: 400 }
      );
    }

    // Update status
    await adminDb.collection(COLLECTIONS.testBookings).doc(id).update({
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Send email notification to client for important status changes
    if ([
      BookingStatus.DepositPaid, 
      BookingStatus.KitDelivered, 
      BookingStatus.ResultReady, 
      BookingStatus.Completed
    ].includes(newStatus)) {
      // Get client email
      const clientDoc = await adminDb.collection(COLLECTIONS.users).doc(booking.clientId).get();
      if (clientDoc.exists) {
        const client = clientDoc.data() as User;
        
        // Get service name
        let serviceName = 'Dịch vụ xét nghiệm DNA';
        if (booking.testServiceId) {
          const serviceDoc = await adminDb.collection(COLLECTIONS.testServices).doc(booking.testServiceId).get();
          if (serviceDoc.exists) {
            serviceName = (serviceDoc.data() as TestService).name;
          }
        }

        // TODO: Send email notification
        console.log(`[Email] Status update to ${newStatus} for booking ${id}`, {
          to: client.email,
          clientName: client.fullName,
          serviceName,
          status: newStatus
        });
      }
    }

    return NextResponse.json<ApiResponse<{ success: boolean; newStatus: BookingStatus }>>(
      { 
        data: { success: true, newStatus }, 
        message: 'Cập nhật trạng thái thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update booking status error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
