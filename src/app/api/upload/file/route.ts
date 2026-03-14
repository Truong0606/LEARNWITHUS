// POST /api/upload/file - Upload document files (PDF, DOCX, JPG, PNG)

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils';
import { saveToLocal } from '@/lib/upload-local';
import type { ApiResponse } from '@/types';

const ALLOWED_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/msword': ['doc'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
};

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng chọn tệp để tải lên', statusCode: 400 },
        { status: 400 }
      );
    }

    const mimeType = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // Validate by MIME type or extension
    const validMime = Object.keys(ALLOWED_TYPES).includes(mimeType);
    const validExt = ALLOWED_EXTENSIONS.includes(ext);

    if (!validMime && !validExt) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ chấp nhận file PDF, DOCX, JPG hoặc PNG', statusCode: 400 },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Tệp không được vượt quá 10MB', statusCode: 400 },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : 'bin';

    const publicUrl = await saveToLocal(buffer, 'documents', payload.userId, safeExt);

    return NextResponse.json<ApiResponse<{ url: string; name: string; type: string; size: number }>>(
      {
        data: {
          url: publicUrl,
          name: file.name,
          type: safeExt,
          size: file.size,
        },
        message: 'Tải tệp lên thành công',
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    const err = error as Error;
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: err.message || 'Lỗi máy chủ khi tải tệp lên', statusCode: 500 },
      { status: 500 }
    );
  }
}
