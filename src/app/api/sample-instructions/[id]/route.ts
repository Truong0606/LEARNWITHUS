// GET /api/sample-instructions/[id] - Get instruction by ID
// PUT /api/sample-instructions/[id] - Update instruction
// DELETE /api/sample-instructions/[id] - Delete instruction

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  SampleTypeInstruction,
  SampleType,
  ApiResponse 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get instruction by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const instructionDoc = await adminDb
      .collection(COLLECTIONS.sampleInstructions)
      .doc(id)
      .get();

    if (!instructionDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy hướng dẫn', statusCode: 404 },
        { status: 404 }
      );
    }

    const instruction = instructionDoc.data() as SampleTypeInstruction;

    return NextResponse.json<ApiResponse<SampleTypeInstruction>>(
      { data: instruction, message: 'Lấy thông tin hướng dẫn thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get sample instruction error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update instruction
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

    // Only Staff, Manager, Admin can update instructions
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền cập nhật hướng dẫn', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: {
      sampleType?: SampleType;
      title?: string;
      instructions?: string;
      videoUrl?: string;
      imageUrls?: string[];
    } = await request.json();

    const instructionDoc = await adminDb
      .collection(COLLECTIONS.sampleInstructions)
      .doc(id)
      .get();

    if (!instructionDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy hướng dẫn', statusCode: 404 },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.sampleType !== undefined) {
      // Check if another instruction exists for this sample type
      const existingSnapshot = await adminDb
        .collection(COLLECTIONS.sampleInstructions)
        .where('sampleType', '==', body.sampleType)
        .get();

      const existingOther = existingSnapshot.docs.find(doc => doc.id !== id);
      if (existingOther) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Hướng dẫn cho loại mẫu này đã tồn tại', statusCode: 400 },
          { status: 400 }
        );
      }
      updateData.sampleType = body.sampleType;
    }

    if (body.title !== undefined) updateData.title = body.title;
    if (body.instructions !== undefined) updateData.instructions = body.instructions;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
    if (body.imageUrls !== undefined) updateData.imageUrls = body.imageUrls;

    await adminDb.collection(COLLECTIONS.sampleInstructions).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật hướng dẫn thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update sample instruction error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete instruction
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

    // Only Admin can delete instructions
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền xóa hướng dẫn', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const instructionDoc = await adminDb
      .collection(COLLECTIONS.sampleInstructions)
      .doc(id)
      .get();

    if (!instructionDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy hướng dẫn', statusCode: 404 },
        { status: 404 }
      );
    }

    await adminDb.collection(COLLECTIONS.sampleInstructions).doc(id).delete();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa hướng dẫn thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete sample instruction error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
