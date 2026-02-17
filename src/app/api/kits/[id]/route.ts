// GET /api/kits/[id] - Get kit by ID
// PUT /api/kits/[id] - Update kit
// DELETE /api/kits/[id] - Delete kit

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  TestKit, 
  TestBooking,
  TestSample,
  ApiResponse,
  SampleCollectionMethod 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get kit by ID
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

    // Get kit
    const kitDoc = await adminDb.collection(COLLECTIONS.testKits).doc(id).get();

    if (!kitDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kit', statusCode: 404 },
        { status: 404 }
      );
    }

    const kit = kitDoc.data() as TestKit;

    // Check permission: Client can only see their own booking's kit
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

    // Get booking info
    if (kit.bookingId) {
      const bookingDoc = await adminDb
        .collection(COLLECTIONS.testBookings)
        .doc(kit.bookingId)
        .get();
      
      if (bookingDoc.exists) {
        kit.booking = bookingDoc.data() as TestBooking;
      }
    }

    // Get samples
    const samplesSnapshot = await adminDb
      .collection(COLLECTIONS.testSamples)
      .where('kitId', '==', id)
      .get();

    kit.samples = samplesSnapshot.docs.map(doc => doc.data() as TestSample);

    return NextResponse.json<ApiResponse<TestKit>>(
      { data: kit, message: 'Lấy thông tin kit thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get kit error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update kit
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

    // Only Staff, Manager, Admin can update kits
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: { 
      collectionMethod?: SampleCollectionMethod;
      sampleCount?: number;
    } = await request.json();

    // Get kit
    const kitDoc = await adminDb.collection(COLLECTIONS.testKits).doc(id).get();

    if (!kitDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kit', statusCode: 404 },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.collectionMethod !== undefined) {
      updateData.collectionMethod = body.collectionMethod;
    }
    if (body.sampleCount !== undefined) {
      updateData.sampleCount = body.sampleCount;
    }

    await adminDb.collection(COLLECTIONS.testKits).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật kit thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update kit error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete kit
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

    // Only Admin can delete kits
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Get kit
    const kitDoc = await adminDb.collection(COLLECTIONS.testKits).doc(id).get();

    if (!kitDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kit', statusCode: 404 },
        { status: 404 }
      );
    }

    const batch = adminDb.batch();

    // Delete all samples in this kit
    const samplesSnapshot = await adminDb
      .collection(COLLECTIONS.testSamples)
      .where('kitId', '==', id)
      .get();

    samplesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete kit
    batch.delete(adminDb.collection(COLLECTIONS.testKits).doc(id));

    await batch.commit();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa kit thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete kit error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
