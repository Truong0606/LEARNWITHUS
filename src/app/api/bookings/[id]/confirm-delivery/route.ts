// POST /api/bookings/[id]/confirm-delivery - Client confirms kit delivery received

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { TestBooking, ApiResponse, BookingStatus, LogisticStatus } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Client confirms they received the kit
export async function POST(
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

    const { id } = await context.params;

    // Get booking
    const bookingDoc = await adminDb.collection(COLLECTIONS.testBookings).doc(id).get();

    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as TestBooking;

    // Check permission: only booking owner can confirm
    if (booking.clientId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    // Check status: must be KitDelivering
    if (booking.status !== BookingStatus.KitDelivering) {
      return NextResponse.json<ApiResponse<null>>(
        { 
          data: null, 
          message: 'Trạng thái đặt lịch không phù hợp để xác nhận nhận kit', 
          statusCode: 400 
        },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();

    // Update booking status to KitDelivered
    batch.update(adminDb.collection(COLLECTIONS.testBookings).doc(id), {
      status: BookingStatus.KitDelivered,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Update logistics info status if exists
    const logisticsSnapshot = await adminDb
      .collection(COLLECTIONS.logistics)
      .where('bookingId', '==', id)
      .where('type', '==', 'KitDelivery')
      .limit(1)
      .get();

    if (!logisticsSnapshot.empty) {
      const logisticsDoc = logisticsSnapshot.docs[0];
      batch.update(logisticsDoc.ref, {
        status: LogisticStatus.KitDelivered,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xác nhận nhận kit thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Confirm delivery error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
