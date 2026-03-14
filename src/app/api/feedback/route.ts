// GET /api/feedback - Get all feedback (public: published only)
// POST /api/feedback - Create feedback (authenticated users)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { Feedback, User, ApiResponse } from '@/types';

// GET - Get all feedback
export async function GET(request: NextRequest) {
  try {
    // Check if authenticated (optional)
    const authHeader = request.headers.get('authorization');
    let payload = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      payload = verifyToken(token);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.feedback);

    // Public users can only see published feedback
    if (!payload || !['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      query = query.where('isPublished', '==', true);
    }

    query = query.orderBy('createdAt', 'desc');

    const feedbackSnapshot = await query.get();
    const allFeedback = feedbackSnapshot.docs;
    
    // Manual pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDocs = allFeedback.slice(startIndex, endIndex);

    const feedbackList: Feedback[] = [];

    for (const doc of paginatedDocs) {
      const feedbackData = doc.data() as Feedback;
      
      // Get user info (masked for privacy in public view)
      if (feedbackData.userId) {
        const userDoc = await adminDb
          .collection(COLLECTIONS.users)
          .doc(feedbackData.userId)
          .get();
        
        if (userDoc.exists) {
          const user = userDoc.data() as User;
          feedbackData.user = {
            id: user.id,
            fullName: maskName(user.fullName),
            email: '',
            phone: '',
            address: '',
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt
          };
        }
      }

      feedbackList.push(feedbackData);
    }

    // Calculate average rating
    const allPublishedSnapshot = await adminDb
      .collection(COLLECTIONS.feedback)
      .where('isPublished', '==', true)
      .get();

    const ratings = allPublishedSnapshot.docs.map(d => d.data().rating as number);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;

    return NextResponse.json<ApiResponse<{
      feedback: Feedback[];
      stats: {
        averageRating: number;
        totalReviews: number;
      };
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>(
      { 
        data: {
          feedback: feedbackList,
          stats: {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: ratings.length
          },
          pagination: {
            page,
            limit,
            total: allFeedback.length,
            totalPages: Math.ceil(allFeedback.length / limit)
          }
        }, 
        message: 'Lấy danh sách đánh giá thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// Mask name for privacy (e.g., "Nguyen Van A" -> "Nguyen V***")
function maskName(name: string): string {
  const parts = name.split(' ');
  if (parts.length <= 1) return name[0] + '***';
  
  const lastName = parts[parts.length - 1];
  const firstParts = parts.slice(0, -1).join(' ');
  return `${firstParts} ${lastName[0]}***`;
}

// POST - Create feedback
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

    const body: {
      bookingId?: string;
      rating: number;
      comment: string;
    } = await request.json();

    const { bookingId, rating, comment } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Đánh giá phải từ 1 đến 5 sao', statusCode: 400 },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Nội dung đánh giá không được để trống', statusCode: 400 },
        { status: 400 }
      );
    }

    // If mentorBookingId provided, verify it belongs to user and is completed
    if (bookingId) {
      const mentorBookingDoc = await adminDb
        .collection(COLLECTIONS.mentorBookings)
        .doc(bookingId)
        .get();

      if (!mentorBookingDoc.exists) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
          { status: 404 }
        );
      }

      const mb = mentorBookingDoc.data() as { userId: string; status: string };
      if (mb.userId !== payload.userId) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không có quyền đánh giá đặt lịch này', statusCode: 403 },
          { status: 403 }
        );
      }
      if (mb.status !== 'completed') {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Chỉ có thể đánh giá sau khi buổi học hoàn thành', statusCode: 400 },
          { status: 400 }
        );
      }

      const existingFeedback = await adminDb
        .collection(COLLECTIONS.feedback)
        .where('bookingId', '==', bookingId)
        .limit(1)
        .get();

      if (!existingFeedback.empty) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Bạn đã đánh giá buổi học này rồi', statusCode: 400 },
          { status: 400 }
        );
      }
    }

    // Create feedback
    const feedbackData: Omit<Feedback, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: payload.userId,
      bookingId: bookingId || undefined,
      rating,
      comment: comment.trim(),
      isPublished: false // Requires admin approval
    };

    const feedbackId = await createDocument(COLLECTIONS.feedback, feedbackData);

    return NextResponse.json<ApiResponse<{ feedbackId: string }>>(
      { 
        data: { feedbackId }, 
        message: 'Gửi đánh giá thành công! Đánh giá sẽ được hiển thị sau khi được duyệt.', 
        statusCode: 201 
      },
      { status: 201 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
