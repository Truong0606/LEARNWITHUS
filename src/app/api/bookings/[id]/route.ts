// GET /api/bookings/[id] - Get booking detail
// PUT /api/bookings/[id] - Update booking
// DELETE /api/bookings/[id] - Delete booking

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  TestBooking, 
  TestService, 
  User, 
  TestKit,
  UpdateTestBookingDto, 
  ApiResponse,
  BookingStatus 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get booking detail with relations
export async function GET(
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

    // Check permission: Client can only see their own bookings
    if (payload.role === 'Client' && booking.clientId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    // Get related data
    // 1. Client info
    if (booking.clientId) {
      const clientDoc = await adminDb.collection(COLLECTIONS.users).doc(booking.clientId).get();
      if (clientDoc.exists) {
        const clientData = clientDoc.data() as User;
        booking.client = {
          id: clientData.id,
          fullName: clientData.fullName,
          email: clientData.email,
          phone: clientData.phone,
          address: clientData.address,
          role: clientData.role,
          isActive: clientData.isActive,
          createdAt: clientData.createdAt
        };
      }
    }

    // 2. Service info
    if (booking.testServiceId) {
      const serviceDoc = await adminDb.collection(COLLECTIONS.testServices).doc(booking.testServiceId).get();
      if (serviceDoc.exists) {
        booking.testService = serviceDoc.data() as TestService;
      }
    }

    // 3. Kit info
    const kitSnapshot = await adminDb
      .collection(COLLECTIONS.testKits)
      .where('bookingId', '==', id)
      .limit(1)
      .get();

    if (!kitSnapshot.empty) {
      booking.kit = kitSnapshot.docs[0].data() as TestKit;
    }

    return NextResponse.json<ApiResponse<TestBooking>>(
      { data: booking, message: 'Lấy thông tin đặt lịch thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update booking
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

    const { id } = await context.params;
    const body: UpdateTestBookingDto = await request.json();

    // Get booking
    const bookingDoc = await adminDb.collection(COLLECTIONS.testBookings).doc(id).get();

    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as TestBooking;

    // Check permission
    if (payload.role === 'Client' && booking.clientId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.appointmentDate !== undefined) {
      updateData.appointmentDate = new Date(body.appointmentDate);
    }
    if (body.note !== undefined) {
      updateData.note = body.note;
    }
    // Status update should use the dedicated endpoint
    if (body.status !== undefined && payload.role !== 'Client') {
      updateData.status = body.status;
    }

    await adminDb.collection(COLLECTIONS.testBookings).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật đặt lịch thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete booking (only Pending bookings)
export async function DELETE(
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

    // Check permission
    if (payload.role === 'Client' && booking.clientId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    // Only allow deletion of Pending bookings
    if (booking.status !== BookingStatus.Pending) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ có thể xóa đặt lịch ở trạng thái chờ xử lý', statusCode: 400 },
        { status: 400 }
      );
    }

    // Delete associated kit
    const kitSnapshot = await adminDb
      .collection(COLLECTIONS.testKits)
      .where('bookingId', '==', id)
      .get();

    const batch = adminDb.batch();
    
    kitSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete booking
    batch.delete(adminDb.collection(COLLECTIONS.testBookings).doc(id));

    await batch.commit();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa đặt lịch thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete booking error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
