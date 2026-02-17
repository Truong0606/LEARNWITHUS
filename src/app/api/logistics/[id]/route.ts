// GET /api/logistics/[id] - Get logistics task by ID
// PUT /api/logistics/[id] - Update logistics task
// DELETE /api/logistics/[id] - Delete logistics task

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  LogisticsInfo,
  User,
  ApiResponse,
  LogisticStatus 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get logistics task by ID
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

    // Only Staff, Manager, Admin can view logistics
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Get logistics
    const logisticsDoc = await adminDb.collection(COLLECTIONS.logistics).doc(id).get();

    if (!logisticsDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy logistics', statusCode: 404 },
        { status: 404 }
      );
    }

    const logistics = logisticsDoc.data() as LogisticsInfo;

    // Staff can only see their assigned tasks
    if (payload.role === 'Staff' && logistics.staffId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    // Get staff info
    if (logistics.staffId) {
      const staffDoc = await adminDb
        .collection(COLLECTIONS.users)
        .doc(logistics.staffId)
        .get();
      
      if (staffDoc.exists) {
        const staff = staffDoc.data() as User;
        logistics.staff = {
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

    return NextResponse.json<ApiResponse<LogisticsInfo>>(
      { data: logistics, message: 'Lấy thông tin logistics thành công', statusCode: 200 },
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

// PUT - Update logistics task
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

    // Only Staff, Manager, Admin can update logistics
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: {
      staffId?: string;
      status?: LogisticStatus;
      scheduledAt?: string;
      note?: string;
      evidenceImageUrl?: string;
    } = await request.json();

    // Get logistics
    const logisticsDoc = await adminDb.collection(COLLECTIONS.logistics).doc(id).get();

    if (!logisticsDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy logistics', statusCode: 404 },
        { status: 404 }
      );
    }

    const logistics = logisticsDoc.data() as LogisticsInfo;

    // Staff can only update their assigned tasks
    if (payload.role === 'Staff' && logistics.staffId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền cập nhật', statusCode: 403 },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    // Only Manager/Admin can assign staff
    if (body.staffId !== undefined && ['Manager', 'Admin'].includes(payload.role)) {
      updateData.staffId = body.staffId;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
      
      // Set completedAt if status is completed
      if ([LogisticStatus.KitDelivered, LogisticStatus.SampleReceived].includes(body.status)) {
        updateData.completedAt = FieldValue.serverTimestamp();
      }
    }

    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = new Date(body.scheduledAt);
    }

    if (body.note !== undefined) {
      updateData.note = body.note;
    }

    if (body.evidenceImageUrl !== undefined) {
      updateData.evidenceImageUrl = body.evidenceImageUrl;
    }

    await adminDb.collection(COLLECTIONS.logistics).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật logistics thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update logistics error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete logistics task
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

    // Only Admin can delete logistics
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Get logistics
    const logisticsDoc = await adminDb.collection(COLLECTIONS.logistics).doc(id).get();

    if (!logisticsDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy logistics', statusCode: 404 },
        { status: 404 }
      );
    }

    await adminDb.collection(COLLECTIONS.logistics).doc(id).delete();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa logistics thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete logistics error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
