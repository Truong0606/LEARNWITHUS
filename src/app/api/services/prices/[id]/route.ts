// GET /api/services/prices/[id] - Get price by ID
// PUT /api/services/prices/[id] - Update price (Admin/Manager only)
// DELETE /api/services/prices/[id] - Delete price (Admin/Manager only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { ServicePrice, UpdateServicePriceDto, ApiResponse } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get price by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const priceDoc = await adminDb.collection(COLLECTIONS.servicePrices).doc(id).get();

    if (!priceDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy giá dịch vụ', statusCode: 404 },
        { status: 404 }
      );
    }

    const price = priceDoc.data() as ServicePrice;

    return NextResponse.json<ApiResponse<ServicePrice>>(
      { data: price, message: 'Lấy thông tin giá thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get price error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update price
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

    // Check role
    if (payload.role !== 'Admin' && payload.role !== 'Manager') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: UpdateServicePriceDto = await request.json();

    // Check if price exists
    const priceDoc = await adminDb.collection(COLLECTIONS.servicePrices).doc(id).get();

    if (!priceDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy giá dịch vụ', statusCode: 404 },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.price !== undefined) updateData.price = body.price;
    if (body.collectionMethod !== undefined) updateData.collectionMethod = body.collectionMethod;
    if (body.effectiveTo !== undefined) updateData.effectiveTo = new Date(body.effectiveTo);

    await adminDb.collection(COLLECTIONS.servicePrices).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật giá thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update price error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete price
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

    // Check role
    if (payload.role !== 'Admin' && payload.role !== 'Manager') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Check if price exists
    const priceDoc = await adminDb.collection(COLLECTIONS.servicePrices).doc(id).get();

    if (!priceDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy giá dịch vụ', statusCode: 404 },
        { status: 404 }
      );
    }

    await adminDb.collection(COLLECTIONS.servicePrices).doc(id).delete();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa giá thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete price error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

