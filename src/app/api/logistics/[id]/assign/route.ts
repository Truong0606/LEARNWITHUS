// POST /api/logistics/[id]/assign - Assign staff to logistics task

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  LogisticsInfo,
  User,
  ApiResponse,
  LogisticStatus,
  LogisticsType 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Assign staff to logistics task
export async function POST(
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

    // Only Manager, Admin can assign staff
    if (!['Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền phân công', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: { staffId: string } = await request.json();

    if (!body.staffId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng chọn nhân viên', statusCode: 400 },
        { status: 400 }
      );
    }

    // Verify staff exists and is active
    const staffDoc = await adminDb
      .collection(COLLECTIONS.users)
      .doc(body.staffId)
      .get();

    if (!staffDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy nhân viên', statusCode: 404 },
        { status: 404 }
      );
    }

    const staff = staffDoc.data() as User;
    if (!staff.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Nhân viên đã bị vô hiệu hóa', statusCode: 400 },
        { status: 400 }
      );
    }

    if (!['Staff', 'Manager'].includes(staff.role.toString())) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Người dùng không phải nhân viên', statusCode: 400 },
        { status: 400 }
      );
    }

    // Get logistics
    const logisticsDoc = await adminDb.collection(COLLECTIONS.logistics).doc(id).get();

    if (!logisticsDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy logistics', statusCode: 404 },
        { status: 404 }
      );
    }

    const logistics = logisticsDoc.data() as LogisticsInfo;

    // Update status based on type
    let newStatus = logistics.status;
    if (logistics.type === LogisticsType.Delivery && logistics.status === LogisticStatus.PreparingKit) {
      newStatus = LogisticStatus.DeliveringKit;
    } else if (logistics.type === LogisticsType.Pickup && logistics.status === LogisticStatus.WaitingForPickup) {
      newStatus = LogisticStatus.PickingUpSample;
    }

    // Update logistics with staff assignment
    await adminDb.collection(COLLECTIONS.logistics).doc(id).update({
      staffId: body.staffId,
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json<ApiResponse<{ 
      success: boolean; 
      staffName: string;
      newStatus: LogisticStatus;
    }>>(
      { 
        data: { 
          success: true, 
          staffName: staff.fullName,
          newStatus 
        }, 
        message: 'Phân công nhân viên thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Assign staff error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
