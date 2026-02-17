// POST /api/upload/result - Upload result file to Firebase Storage

import { NextRequest, NextResponse } from 'next/server';
import { adminStorage, COLLECTIONS, adminDb } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { ApiResponse } from '@/types';

// POST - Upload result file
export async function POST(request: NextRequest) {
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

    // Only Staff, Manager, Admin can upload results
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bookingId = formData.get('bookingId') as string;

    if (!file) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng chọn file để tải lên', statusCode: 400 },
        { status: 400 }
      );
    }

    if (!bookingId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng cung cấp booking ID', statusCode: 400 },
        { status: 400 }
      );
    }

    // Validate file type (PDF or image)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ chấp nhận file PDF hoặc hình ảnh (JPEG, PNG)', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'File không được vượt quá 10MB', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check if booking exists
    const bookingDoc = await adminDb
      .collection(COLLECTIONS.testBookings)
      .doc(bookingId)
      .get();

    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `results/${bookingId}/${timestamp}.${fileExtension}`;

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          bookingId,
          uploadedBy: payload.userId,
          originalName: file.name
        }
      }
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return NextResponse.json<ApiResponse<{ fileUrl: string; fileName: string }>>(
      { 
        data: { fileUrl: publicUrl, fileName: file.name }, 
        message: 'Tải file lên thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Upload result file error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ khi tải file lên', statusCode: 500 },
      { status: 500 }
    );
  }
}
