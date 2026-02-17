// GET /api/results - Get all results (Admin/Staff only)
// POST /api/results - Create result (Staff only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { 
  TestResult, 
  TestBooking,
  User,
  CreateTestResultDto, 
  ApiResponse,
  BookingStatus 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

// GET - Get all results
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

    // Only Staff, Manager, Admin can view all results
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const resultsSnapshot = await adminDb
      .collection(COLLECTIONS.testResults)
      .orderBy('createdAt', 'desc')
      .get();

    const results: TestResult[] = [];

    for (const doc of resultsSnapshot.docs) {
      const resultData = doc.data() as TestResult;
      
      // Get booking info
      if (resultData.testBookingId) {
        const bookingDoc = await adminDb
          .collection(COLLECTIONS.testBookings)
          .doc(resultData.testBookingId)
          .get();
        
        if (bookingDoc.exists) {
          resultData.testBooking = bookingDoc.data() as TestBooking;
        }
      }

      results.push(resultData);
    }

    return NextResponse.json<ApiResponse<TestResult[]>>(
      { data: results, message: 'Lấy danh sách kết quả thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create result
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

    // Only Staff, Manager, Admin can create results
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const body: CreateTestResultDto = await request.json();
    const { testBookingId, resultSummary, resultFileUrl } = body;

    // Validate required fields
    if (!testBookingId || !resultSummary || !resultFileUrl) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng điền đầy đủ thông tin', statusCode: 400 },
        { status: 400 }
      );
    }

    // Get booking
    const bookingDoc = await adminDb
      .collection(COLLECTIONS.testBookings)
      .doc(testBookingId)
      .get();

    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as TestBooking;

    // Check if booking is in Testing status
    if (booking.status !== BookingStatus.Testing) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Đặt lịch chưa ở trạng thái đang xét nghiệm', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check if result already exists
    const existingResultSnapshot = await adminDb
      .collection(COLLECTIONS.testResults)
      .where('testBookingId', '==', testBookingId)
      .limit(1)
      .get();

    if (!existingResultSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Kết quả đã tồn tại cho đặt lịch này', statusCode: 400 },
        { status: 400 }
      );
    }

    // Create result
    const resultData: Omit<TestResult, 'id' | 'createdAt' | 'updatedAt'> = {
      testBookingId,
      resultSummary,
      resultDate: new Date(),
      resultFileUrl
    };

    const resultId = await createDocument(COLLECTIONS.testResults, resultData);

    // Update booking status to ResultReady
    await adminDb.collection(COLLECTIONS.testBookings).doc(testBookingId).update({
      status: BookingStatus.ResultReady,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Send email notification to client
    const clientDoc = await adminDb.collection(COLLECTIONS.users).doc(booking.clientId).get();
    if (clientDoc.exists) {
      const client = clientDoc.data() as User;
      // TODO: Send email notification
      console.log(`[Email] Result ready for booking ${testBookingId}`, {
        to: client.email,
        clientName: client.fullName,
        bookingId: testBookingId
      });
    }

    return NextResponse.json<ApiResponse<{ resultId: string }>>(
      { data: { resultId }, message: 'Tạo kết quả thành công', statusCode: 201 },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create result error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
