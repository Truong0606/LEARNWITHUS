// GET /api/samples/kit/[kitId] - Get all samples by kit ID

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  TestSample,
  TestKit,
  TestBooking,
  ApiResponse 
} from '@/types';

interface RouteContext {
  params: Promise<{ kitId: string }>;
}

// GET - Get samples by kit ID
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

    const { kitId } = await context.params;

    // Get kit
    const kitDoc = await adminDb.collection(COLLECTIONS.testKits).doc(kitId).get();

    if (!kitDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kit', statusCode: 404 },
        { status: 404 }
      );
    }

    const kit = kitDoc.data() as TestKit;

    // Check permission: Client can only see their own booking's samples
    if (payload.role === 'Client') {
      const bookingDoc = await adminDb
        .collection(COLLECTIONS.testBookings)
        .doc(kit.bookingId)
        .get();

      if (!bookingDoc.exists) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
          { status: 404 }
        );
      }

      const booking = bookingDoc.data() as TestBooking;
      if (booking.clientId !== payload.userId) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
          { status: 403 }
        );
      }
    }

    // Get samples
    const samplesSnapshot = await adminDb
      .collection(COLLECTIONS.testSamples)
      .where('kitId', '==', kitId)
      .orderBy('createdAt', 'asc')
      .get();

    const samples: TestSample[] = samplesSnapshot.docs.map(doc => doc.data() as TestSample);

    return NextResponse.json<ApiResponse<{ samples: TestSample[]; kit: TestKit }>>(
      { 
        data: { samples, kit }, 
        message: 'Lấy danh sách mẫu thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get samples by kit error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
