// POST /api/upload/image - Upload image to Firebase Cloud Storage

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils';
import { uploadToCloud } from '@/lib/firebase/storage-admin';
import type { ApiResponse } from '@/types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB (Firebase is more generous than local)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng đăng nhập', statusCode: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'images';

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng chọn ảnh để tải lên', statusCode: 400 },
        { status: 400 }
      );
    }

    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP', statusCode: 400 },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Ảnh không được vượt quá 10MB', statusCode: 400 },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpeg', 'jpg', 'png', 'webp'].includes(ext) ? ext : 'jpg';

    // Upload to Firebase Storage
    const publicUrl = await uploadToCloud(
      buffer,
      folder,
      payload.userId,
      safeExt,
      mimeType
    );

    return NextResponse.json<ApiResponse<{ url: string }>>(
      { data: { url: publicUrl }, message: 'Tải ảnh lên mây thành công', statusCode: 200 },
      { status: 200 }
    );
  } catch (error) {
    const err = error as Error;
    console.error('Upload image error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi khi đưa ảnh lên mây: ' + err.message, statusCode: 500 },
      { status: 500 }
    );
  }
}

