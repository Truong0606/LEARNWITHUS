// POST /api/auth/register
// Register endpoint

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { hashPassword, isValidEmail, isValidPhone } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { User, UserRole, RegisterRequest, ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { fullName, email, phone, password, address } = body;

    // Validate required fields
    if (!fullName || !email || !phone || !password) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng điền đầy đủ thông tin', statusCode: 400 },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Số điện thoại không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Mật khẩu phải có ít nhất 6 ký tự', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUserSnapshot = await adminDb
      .collection(COLLECTIONS.users)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existingUserSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email đã tồn tại', statusCode: 400 },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user document
    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address?.trim() || '',
      passwordHash,
      role: UserRole.Client, // Default role is Client
      isActive: true
    };

    const userId = await createDocument(COLLECTIONS.users, userData);

    return NextResponse.json<ApiResponse<{ userId: string }>>(
      { 
        data: { userId }, 
        message: 'Đăng ký thành công', 
        statusCode: 201 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

