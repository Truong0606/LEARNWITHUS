// GET /api/services/[id] - Get service by ID
// PUT /api/services/[id] - Update service (Admin/Manager only)
// DELETE /api/services/[id] - Delete service (Admin/Manager only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { TestService, ServicePrice, UpdateTestServiceDto, ApiResponse } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get service by ID with prices
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Get service
    const serviceDoc = await adminDb.collection(COLLECTIONS.testServices).doc(id).get();

    if (!serviceDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy dịch vụ', statusCode: 404 },
        { status: 404 }
      );
    }

    const service = serviceDoc.data() as TestService;

    // Get associated prices
    const pricesSnapshot = await adminDb
      .collection(COLLECTIONS.servicePrices)
      .where('serviceId', '==', id)
      .where('effectiveTo', '==', null)
      .get();

    const prices: ServicePrice[] = pricesSnapshot.docs.map(doc => doc.data() as ServicePrice);

    const serviceWithPrices = {
      ...service,
      prices
    };

    return NextResponse.json<ApiResponse<typeof serviceWithPrices>>(
      { data: serviceWithPrices, message: 'Lấy thông tin dịch vụ thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update service
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

    // Check role (Admin or Manager only)
    if (payload.role !== 'Admin' && payload.role !== 'Manager') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: UpdateTestServiceDto = await request.json();

    // Check if service exists
    const serviceDoc = await adminDb.collection(COLLECTIONS.testServices).doc(id).get();

    if (!serviceDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy dịch vụ', statusCode: 404 },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.sampleCount !== undefined) updateData.sampleCount = body.sampleCount;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.imageUrl !== undefined) {
      updateData.imageUrl = body.imageUrl.trim() || null;
    }
    if (body.features !== undefined) {
      const normalized = body.features
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0);
      updateData.features = normalized;
    }

    // Update service
    await adminDb.collection(COLLECTIONS.testServices).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật dịch vụ thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
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

    // Check role (Admin or Manager only)
    if (payload.role !== 'Admin' && payload.role !== 'Manager') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Check if service exists
    const serviceDoc = await adminDb.collection(COLLECTIONS.testServices).doc(id).get();

    if (!serviceDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy dịch vụ', statusCode: 404 },
        { status: 404 }
      );
    }

    // Delete associated prices first
    const pricesSnapshot = await adminDb
      .collection(COLLECTIONS.servicePrices)
      .where('serviceId', '==', id)
      .get();

    const batch = adminDb.batch();
    
    pricesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete service
    batch.delete(adminDb.collection(COLLECTIONS.testServices).doc(id));

    await batch.commit();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa dịch vụ thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

