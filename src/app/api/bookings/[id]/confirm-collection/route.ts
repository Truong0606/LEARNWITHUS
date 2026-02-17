// POST /api/bookings/[id]/confirm-collection - Client confirms sample collection done

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { TestBooking, ApiResponse, BookingStatus, TestKit } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Client confirms they have collected samples
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

    // Check status: must be KitDelivered
    if (booking.status !== BookingStatus.KitDelivered) {
      return NextResponse.json<ApiResponse<null>>(
        { 
          data: null, 
          message: 'Trạng thái đặt lịch không phù hợp để xác nhận thu mẫu', 
          statusCode: 400 
        },
        { status: 400 }
      );
    }

    // Check if all samples have been created
    const kitSnapshot = await adminDb
      .collection(COLLECTIONS.testKits)
      .where('bookingId', '==', id)
      .limit(1)
      .get();

    if (kitSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kit xét nghiệm', statusCode: 404 },
        { status: 404 }
      );
    }

    const kit = kitSnapshot.docs[0].data() as TestKit;

    // Check if required samples are created
    const samplesSnapshot = await adminDb
      .collection(COLLECTIONS.testSamples)
      .where('kitId', '==', kit.id)
      .get();

    if (samplesSnapshot.size < kit.sampleCount) {
      return NextResponse.json<ApiResponse<null>>(
        { 
          data: null, 
          message: `Cần có đủ ${kit.sampleCount} mẫu xét nghiệm trước khi xác nhận thu mẫu`, 
          statusCode: 400 
        },
        { status: 400 }
      );
    }

    // Update booking status to SampleCollected
    await adminDb.collection(COLLECTIONS.testBookings).doc(id).update({
      status: BookingStatus.SampleCollected,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xác nhận thu mẫu thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Confirm collection error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
