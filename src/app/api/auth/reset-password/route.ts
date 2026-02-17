// POST /api/auth/reset-password
// Verify OTP and reset password

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { hashPassword, verifyOTP, isValidEmail } from '@/lib/utils';
import { User, OtpCode, OtpPurpose, ApiResponse } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email, otpCode, newPassword } = await request.json();

    // Validate required fields
    if (!email || !otpCode || !newPassword) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng điền đầy đủ thông tin', statusCode: 400 },
        { status: 400 }
      );
    }

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Mật khẩu phải có ít nhất 6 ký tự', statusCode: 400 },
        { status: 400 }
      );
    }

    // Find user by email
    const usersSnapshot = await adminDb
      .collection(COLLECTIONS.users)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy tài khoản', statusCode: 404 },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data() as User;

    // Find valid OTP
    const now = new Date();
    const otpSnapshot = await adminDb
      .collection(COLLECTIONS.otpCodes)
      .where('userId', '==', user.id)
      .where('purpose', '==', OtpPurpose.ResetPassword)
      .where('isUsed', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (otpSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Mã OTP không hợp lệ hoặc đã hết hạn', statusCode: 400 },
        { status: 400 }
      );
    }

    const otpDoc = otpSnapshot.docs[0];
    const otpData = otpDoc.data() as OtpCode;

    // Check if OTP is expired
    const expiresAt = otpData.expiresAt instanceof Date 
      ? otpData.expiresAt 
      : (otpData.expiresAt as FirebaseFirestore.Timestamp).toDate();
    
    if (expiresAt < now) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Mã OTP đã hết hạn', statusCode: 400 },
        { status: 400 }
      );
    }

    // Verify OTP
    if (!verifyOTP(otpCode, otpData.hashedCode)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Mã OTP không chính xác', statusCode: 400 },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await adminDb.collection(COLLECTIONS.users).doc(user.id).update({
      passwordHash,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Mark OTP as used
    await adminDb.collection(COLLECTIONS.otpCodes).doc(otpDoc.id).update({
      isUsed: true,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { 
        data: { success: true }, 
        message: 'Đặt lại mật khẩu thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
