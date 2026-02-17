// GET /api/samples/[id] - Get sample by ID
// PUT /api/samples/[id] - Update sample
// DELETE /api/samples/[id] - Delete sample

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  TestSample,
  TestKit,
  TestBooking,
  UpdateTestSampleDto, 
  ApiResponse 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get sample by ID
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

    // Get sample
    const sampleDoc = await adminDb.collection(COLLECTIONS.testSamples).doc(id).get();

    if (!sampleDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy mẫu', statusCode: 404 },
        { status: 404 }
      );
    }

    const sample = sampleDoc.data() as TestSample;

    // Check permission: Client can only see their own booking's samples
    if (payload.role === 'Client') {
      // Get kit to get booking
      const kitDoc = await adminDb.collection(COLLECTIONS.testKits).doc(sample.kitId).get();
      if (kitDoc.exists) {
        const kit = kitDoc.data() as TestKit;
        const bookingDoc = await adminDb.collection(COLLECTIONS.testBookings).doc(kit.bookingId).get();
        if (bookingDoc.exists) {
          const booking = bookingDoc.data() as TestBooking;
          if (booking.clientId !== payload.userId) {
            return NextResponse.json<ApiResponse<null>>(
              { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
              { status: 403 }
            );
          }
        }
      }
    }

    // Get kit info
    if (sample.kitId) {
      const kitDoc = await adminDb.collection(COLLECTIONS.testKits).doc(sample.kitId).get();
      if (kitDoc.exists) {
        sample.kit = kitDoc.data() as TestKit;
      }
    }

    return NextResponse.json<ApiResponse<TestSample>>(
      { data: sample, message: 'Lấy thông tin mẫu thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get sample error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update sample
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

    // Only Staff, Manager, Admin can update samples
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: UpdateTestSampleDto = await request.json();

    // Get sample
    const sampleDoc = await adminDb.collection(COLLECTIONS.testSamples).doc(id).get();

    if (!sampleDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy mẫu', statusCode: 404 },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.sampleType !== undefined) {
      updateData.sampleType = body.sampleType;
    }
    if (body.collectedAt !== undefined) {
      updateData.collectedAt = new Date(body.collectedAt);
    }

    await adminDb.collection(COLLECTIONS.testSamples).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật mẫu thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update sample error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete sample
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

    // Only Admin can delete samples
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Get sample
    const sampleDoc = await adminDb.collection(COLLECTIONS.testSamples).doc(id).get();

    if (!sampleDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy mẫu', statusCode: 404 },
        { status: 404 }
      );
    }

    await adminDb.collection(COLLECTIONS.testSamples).doc(id).delete();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa mẫu thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete sample error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
