// POST /api/admin/payos/register-webhook
// Đăng ký webhook URL với PayOS (chỉ cần gọi một lần khi deploy)
// Chỉ Admin mới được gọi endpoint này

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils';
import { confirmWebhook } from '@/lib/payos';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Admin mới được thực hiện thao tác này', statusCode: 403 },
        { status: 403 }
      );
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();
    const webhookUrl = `${baseUrl}/api/payments/webhook`;

    const result = await confirmWebhook(webhookUrl);

    if (!result.success) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: result.message, statusCode: 400 },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<{ webhookUrl: string }>>(
      {
        data: { webhookUrl },
        message: result.message,
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Register PayOS webhook error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
