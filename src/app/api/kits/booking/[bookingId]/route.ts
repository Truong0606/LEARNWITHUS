// GET /api/kits/booking/[bookingId] - Get kit by booking ID

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  TestKit, 
  TestBooking,
  TestSample,
  ApiResponse 
} from '@/types';

interface RouteContext {
  params: Promise<{ bookingId: string }>;
}

// GET - Get kit by booking ID
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

    const { bookingId } = await context.params;

    // Check booking permission
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

    // Check permission: Client can only see their own booking's kit
    if (payload.role === 'Client' && booking.clientId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    // Get kit
    const kitSnapshot = await adminDb
      .collection(COLLECTIONS.testKits)
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get();

    if (kitSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kit cho đặt lịch này', statusCode: 404 },
        { status: 404 }
      );
    }

    const kit = kitSnapshot.docs[0].data() as TestKit;

    // Get samples
    const samplesSnapshot = await adminDb
      .collection(COLLECTIONS.testSamples)
      .where('kitId', '==', kit.id)
      .get();

    kit.samples = samplesSnapshot.docs.map(doc => doc.data() as TestSample);
    kit.booking = booking;

    return NextResponse.json<ApiResponse<TestKit>>(
      { data: kit, message: 'Lấy thông tin kit thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get kit by booking error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
