// POST /api/auth/profile/avatar - Upload avatar to Firebase Cloud Storage

import { NextRequest, NextResponse } from 'next/server';
import { COLLECTIONS, adminDb } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import { uploadToCloud } from '@/lib/firebase/storage-admin';
import type { ApiResponse } from '@/types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB (Firebase is more generous)

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

    const userId = payload.userId;

    const formData = await request.formData();
    const file = formData.get('file') as File;

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
        { data: null, message: 'Ảnh không được vượt quá 5MB', statusCode: 400 },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpeg', 'jpg', 'png', 'webp'].includes(ext) ? ext : 'jpg';

    // Upload to Firebase Storage
    const publicUrl = await uploadToCloud(
      buffer,
      'avatars',
      userId,
      safeExt,
      mimeType
    );

    await adminDb.collection(COLLECTIONS.users).doc(userId).update({
      avatarUrl: publicUrl,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<ApiResponse<{ avatarUrl: string }>>(
      { data: { avatarUrl: publicUrl }, message: 'Cập nhật ảnh đại diện lên mây thành công', statusCode: 200 },
      { status: 200 }
    );
  } catch (error) {
    const err = error as Error;
    console.error('Upload avatar error:', err);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi khi đưa ảnh đại diện lên mây: ' + err.message, statusCode: 500 },
      { status: 500 }
    );
  }
}

