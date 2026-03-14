// POST /api/email/test - Test email sending (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils';
import { ApiResponse } from '@/types';
import { sendOtpEmail, sendWelcomeEmail } from '@/lib/email';

// POST - Test email sending
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const payload = verifyToken(authHeader.substring(7));
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const body: {
      type: 'otp' | 'welcome';
      to: string;
      data?: Record<string, unknown>;
    } = await request.json();

    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thiếu type hoặc email đích', statusCode: 400 },
        { status: 400 }
      );
    }

    let result;
    if (type === 'otp') {
      result = await sendOtpEmail(to, '123456', 'reset');
    } else if (type === 'welcome') {
      result = await sendWelcomeEmail(to, data?.fullName as string || 'Test User');
    } else {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Loại email không hợp lệ (otp | welcome)', statusCode: 400 },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json<ApiResponse<{ messageId: string }>>(
        { 
          data: { messageId: result.messageId || '' }, 
          message: 'Gửi email test thành công', 
          statusCode: 200 
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: `Gửi email thất bại: ${result.error}`, statusCode: 400 },
        { status: 400 }
      );
    }

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
