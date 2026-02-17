// GET /api/results/[id] - Get result by ID
// PUT /api/results/[id] - Update result
// DELETE /api/results/[id] - Delete result

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  TestResult,
  TestBooking,
  ApiResponse 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get result by ID
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

    // Get result
    const resultDoc = await adminDb.collection(COLLECTIONS.testResults).doc(id).get();

    if (!resultDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kết quả', statusCode: 404 },
        { status: 404 }
      );
    }

    const result = resultDoc.data() as TestResult;

    // Check permission: Client can only see their own booking's result
    if (payload.role === 'Client') {
      const bookingDoc = await adminDb
        .collection(COLLECTIONS.testBookings)
        .doc(result.testBookingId)
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

    // Get booking info
    if (result.testBookingId) {
      const bookingDoc = await adminDb
        .collection(COLLECTIONS.testBookings)
        .doc(result.testBookingId)
        .get();

      if (bookingDoc.exists) {
        result.testBooking = bookingDoc.data() as TestBooking;
      }
    }

    return NextResponse.json<ApiResponse<TestResult>>(
      { data: result, message: 'Lấy thông tin kết quả thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get result error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update result
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

    // Only Staff, Manager, Admin can update results
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: { resultSummary?: string; resultFileUrl?: string } = await request.json();

    // Get result
    const resultDoc = await adminDb.collection(COLLECTIONS.testResults).doc(id).get();

    if (!resultDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kết quả', statusCode: 404 },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.resultSummary !== undefined) {
      updateData.resultSummary = body.resultSummary;
    }
    if (body.resultFileUrl !== undefined) {
      updateData.resultFileUrl = body.resultFileUrl;
    }

    await adminDb.collection(COLLECTIONS.testResults).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật kết quả thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update result error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete result
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

    // Only Admin can delete results
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Get result
    const resultDoc = await adminDb.collection(COLLECTIONS.testResults).doc(id).get();

    if (!resultDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kết quả', statusCode: 404 },
        { status: 404 }
      );
    }

    await adminDb.collection(COLLECTIONS.testResults).doc(id).delete();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa kết quả thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete result error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
