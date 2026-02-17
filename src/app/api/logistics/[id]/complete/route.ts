// POST /api/logistics/[id]/complete - Complete logistics task

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  LogisticsInfo,
  TestBooking,
  ApiResponse,
  LogisticStatus,
  LogisticsType,
  BookingStatus 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Complete logistics task
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

    // Only Staff, Manager, Admin can complete tasks
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: { 
      evidenceImageUrl?: string;
      note?: string;
    } = await request.json();

    // Get logistics
    const logisticsDoc = await adminDb.collection(COLLECTIONS.logistics).doc(id).get();

    if (!logisticsDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy logistics', statusCode: 404 },
        { status: 404 }
      );
    }

    const logistics = logisticsDoc.data() as LogisticsInfo & { bookingId?: string };

    // Staff can only complete their own assigned tasks
    if (payload.role === 'Staff' && logistics.staffId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền hoàn thành task này', statusCode: 403 },
        { status: 403 }
      );
    }

    // Determine new status based on type
    let newStatus: LogisticStatus;
    let newBookingStatus: BookingStatus | null = null;

    if (logistics.type === LogisticsType.Delivery) {
      // Delivery: DeliveringKit -> KitDelivered
      if (logistics.status !== LogisticStatus.DeliveringKit) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Task chưa ở trạng thái đang giao', statusCode: 400 },
          { status: 400 }
        );
      }
      newStatus = LogisticStatus.KitDelivered;
      newBookingStatus = BookingStatus.KitDelivering; // Booking waiting for client confirmation
    } else {
      // Pickup: PickingUpSample -> SampleReceived
      if (logistics.status !== LogisticStatus.PickingUpSample) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Task chưa ở trạng thái đang lấy mẫu', statusCode: 400 },
          { status: 400 }
        );
      }
      newStatus = LogisticStatus.SampleReceived;
      newBookingStatus = BookingStatus.SampleReceived;
    }

    const batch = adminDb.batch();

    // Update logistics
    const logisticsUpdate: Record<string, unknown> = {
      status: newStatus,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.evidenceImageUrl) {
      logisticsUpdate.evidenceImageUrl = body.evidenceImageUrl;
    }
    if (body.note) {
      logisticsUpdate.note = body.note;
    }

    batch.update(adminDb.collection(COLLECTIONS.logistics).doc(id), logisticsUpdate);

    // Update booking status if applicable
    if (logistics.bookingId && newBookingStatus) {
      batch.update(adminDb.collection(COLLECTIONS.testBookings).doc(logistics.bookingId), {
        status: newBookingStatus,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    return NextResponse.json<ApiResponse<{ 
      success: boolean;
      newStatus: LogisticStatus;
    }>>(
      { 
        data: { success: true, newStatus }, 
        message: 'Hoàn thành task thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Complete logistics error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
