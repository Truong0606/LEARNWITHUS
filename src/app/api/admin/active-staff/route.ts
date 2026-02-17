// GET /api/admin/active-staff - Get list of active staff (Admin/Manager only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { User, UserRole, ApiResponse } from '@/types';

// Role names mapping
const roleNames: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Staff]: 'Staff',
  [UserRole.Client]: 'Client',
  [UserRole.Manager]: 'Manager'
};

// DTO for staff list
interface StaffListDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
}

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

    // Check role (Admin or Manager only)
    if (payload.role !== 'Admin' && payload.role !== 'Manager') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    // Get active staff members (Staff role only, not Manager or Admin)
    const staffSnapshot = await adminDb
      .collection(COLLECTIONS.users)
      .where('role', '==', UserRole.Staff)
      .where('isActive', '==', true)
      .orderBy('fullName', 'asc')
      .get();

    const staffList: StaffListDto[] = staffSnapshot.docs.map(doc => {
      const data = doc.data() as User;
      return {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: roleNames[data.role] || 'Staff',
        isActive: data.isActive
      };
    });

    return NextResponse.json<ApiResponse<StaffListDto[]>>(
      { data: staffList, message: 'Lấy danh sách nhân viên thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get active staff error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

