// GET /api/logistics - Get all logistics tasks (Staff/Admin)
// POST /api/logistics - Create logistics task (delivery or pickup)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { 
  LogisticsInfo, 
  TestBooking,
  User,
  TestKit,
  ApiResponse,
  LogisticStatus,
  LogisticsType,
  BookingStatus 
} from '@/types';

// GET - Get all logistics tasks
export async function GET(request: NextRequest) {
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

    // Only Staff, Manager, Admin can view logistics
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const staffId = searchParams.get('staffId');

    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.logistics);

    // Filter by status
    if (status !== null) {
      query = query.where('status', '==', parseInt(status));
    }

    // Filter by type
    if (type !== null) {
      query = query.where('type', '==', parseInt(type));
    }

    // Filter by staff (for staff to see their tasks)
    if (staffId) {
      query = query.where('staffId', '==', staffId);
    } else if (payload.role === 'Staff') {
      // Staff can only see their assigned tasks
      query = query.where('staffId', '==', payload.userId);
    }

    query = query.orderBy('scheduledAt', 'asc');

    const logisticsSnapshot = await query.get();
    const logistics: LogisticsInfo[] = [];

    for (const doc of logisticsSnapshot.docs) {
      const logisticsData = doc.data() as LogisticsInfo;
      
      // Get staff info
      if (logisticsData.staffId) {
        const staffDoc = await adminDb
          .collection(COLLECTIONS.users)
          .doc(logisticsData.staffId)
          .get();
        
        if (staffDoc.exists) {
          const staff = staffDoc.data() as User;
          logisticsData.staff = {
            id: staff.id,
            fullName: staff.fullName,
            email: staff.email,
            phone: staff.phone,
            address: staff.address,
            role: staff.role,
            isActive: staff.isActive,
            createdAt: staff.createdAt
          };
        }
      }

      logistics.push(logisticsData);
    }

    return NextResponse.json<ApiResponse<LogisticsInfo[]>>(
      { data: logistics, message: 'Lấy danh sách logistics thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get logistics error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create logistics task
export async function POST(request: NextRequest) {
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

    // Only Staff, Manager, Admin can create logistics
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const body: {
      bookingId: string;
      type: LogisticsType;
      staffId?: string;
      scheduledAt?: string;
      note?: string;
    } = await request.json();

    const { bookingId, type, staffId, scheduledAt, note } = body;

    if (!bookingId || type === undefined) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thiếu thông tin bắt buộc', statusCode: 400 },
        { status: 400 }
      );
    }

    // Get booking
    const bookingDoc = await adminDb
      .collection(COLLECTIONS.testBookings)
      .doc(bookingId)
      .get();

    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as TestBooking;

    // Validate booking status for delivery
    if (type === LogisticsType.Delivery) {
      if (booking.status !== BookingStatus.DepositPaid) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Booking chưa đặt cọc, không thể tạo giao kit', statusCode: 400 },
          { status: 400 }
        );
      }
    }

    // Validate booking status for pickup
    if (type === LogisticsType.Pickup) {
      if (booking.status !== BookingStatus.SampleCollected) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Booking chưa thu mẫu, không thể tạo lấy mẫu', statusCode: 400 },
          { status: 400 }
        );
      }
    }

    // Get kit to update logistics info reference
    const kitSnapshot = await adminDb
      .collection(COLLECTIONS.testKits)
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get();

    // Create logistics task
    const initialStatus = type === LogisticsType.Delivery 
      ? LogisticStatus.PreparingKit 
      : LogisticStatus.WaitingForPickup;

    const logisticsData: Omit<LogisticsInfo, 'id' | 'createdAt' | 'updatedAt'> = {
      staffId: staffId || undefined,
      name: booking.clientName || '',
      address: booking.address || '',
      phone: booking.phone || '',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      note: note || '',
      type,
      status: initialStatus
    };

    const logisticsId = await createDocument(COLLECTIONS.logistics, {
      ...logisticsData,
      bookingId // Store booking reference
    });

    // Update kit with logistics reference
    if (!kitSnapshot.empty) {
      const kitDoc = kitSnapshot.docs[0];
      const updateData: Record<string, string> = {};
      
      if (type === LogisticsType.Delivery) {
        updateData.deliveryInfoId = logisticsId;
      } else {
        updateData.pickupInfoId = logisticsId;
      }

      await adminDb.collection(COLLECTIONS.testKits).doc(kitDoc.id).update(updateData);
    }

    return NextResponse.json<ApiResponse<{ logisticsId: string }>>(
      { data: { logisticsId }, message: 'Tạo logistics thành công', statusCode: 201 },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create logistics error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
