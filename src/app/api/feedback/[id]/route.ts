// GET /api/feedback/[id] - Get feedback by ID
// PUT /api/feedback/[id] - Update feedback (owner or admin)
// DELETE /api/feedback/[id] - Delete feedback

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  Feedback,
  User,
  ApiResponse 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get feedback by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const feedbackDoc = await adminDb.collection(COLLECTIONS.feedback).doc(id).get();

    if (!feedbackDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đánh giá', statusCode: 404 },
        { status: 404 }
      );
    }

    const feedback = feedbackDoc.data() as Feedback;

    // Get user info
    if (feedback.userId) {
      const userDoc = await adminDb
        .collection(COLLECTIONS.users)
        .doc(feedback.userId)
        .get();
      
      if (userDoc.exists) {
        const user = userDoc.data() as User;
        feedback.user = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        };
      }
    }

    return NextResponse.json<ApiResponse<Feedback>>(
      { data: feedback, message: 'Lấy thông tin đánh giá thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update feedback
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;
    const body: {
      rating?: number;
      comment?: string;
      isPublished?: boolean;
    } = await request.json();

    const feedbackDoc = await adminDb.collection(COLLECTIONS.feedback).doc(id).get();

    if (!feedbackDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đánh giá', statusCode: 404 },
        { status: 404 }
      );
    }

    const feedback = feedbackDoc.data() as Feedback;

    // Check permission: owner can update rating/comment, admin can update isPublished
    const isOwner = feedback.userId === payload.userId;
    const isAdmin = ['Admin', 'Manager'].includes(payload.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền cập nhật đánh giá', statusCode: 403 },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    // Owner can update rating and comment
    if (isOwner) {
      if (body.rating !== undefined) {
        if (body.rating < 1 || body.rating > 5) {
          return NextResponse.json<ApiResponse<null>>(
            { data: null, message: 'Đánh giá phải từ 1 đến 5 sao', statusCode: 400 },
            { status: 400 }
          );
        }
        updateData.rating = body.rating;
      }
      if (body.comment !== undefined) {
        updateData.comment = body.comment.trim();
      }
    }

    // Admin can update isPublished
    if (isAdmin && body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
    }

    await adminDb.collection(COLLECTIONS.feedback).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật đánh giá thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete feedback
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const feedbackDoc = await adminDb.collection(COLLECTIONS.feedback).doc(id).get();

    if (!feedbackDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đánh giá', statusCode: 404 },
        { status: 404 }
      );
    }

    const feedback = feedbackDoc.data() as Feedback;

    // Only owner or admin can delete
    const isOwner = feedback.userId === payload.userId;
    const isAdmin = payload.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền xóa đánh giá', statusCode: 403 },
        { status: 403 }
      );
    }

    await adminDb.collection(COLLECTIONS.feedback).doc(id).delete();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa đánh giá thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
