// GET /api/user - Get all users (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { User, ApiResponse, UserRole } from '@/types';

// Role names mapping
const roleNames: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Staff]: 'Staff',
  [UserRole.Client]: 'Client',
  [UserRole.Manager]: 'Manager'
};

// DTO for user list (without sensitive data)
interface UserListDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

// GET - Get all users (Admin only)
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

    // Check role (Admin only)
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const isActiveFilter = searchParams.get('isActive');

    // Build query
    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.users);

    // Apply filters
    if (roleFilter !== null) {
      const roleValue = parseInt(roleFilter);
      if (!isNaN(roleValue) && roleValue in UserRole) {
        query = query.where('role', '==', roleValue);
      }
    }

    if (isActiveFilter !== null) {
      query = query.where('isActive', '==', isActiveFilter === 'true');
    }

    // Order by creation date
    query = query.orderBy('createdAt', 'desc');

    const snapshot = await query.get();

    const users: UserListDto[] = snapshot.docs.map(doc => {
      const data = doc.data() as User;
      return {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        role: roleNames[data.role] || 'Client',
        isActive: data.isActive,
        createdAt: data.createdAt instanceof Date 
          ? data.createdAt 
          : (data.createdAt as FirebaseFirestore.Timestamp).toDate()
      };
    });

    return NextResponse.json<ApiResponse<UserListDto[]>>(
      { data: users, message: 'Lấy danh sách người dùng thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

