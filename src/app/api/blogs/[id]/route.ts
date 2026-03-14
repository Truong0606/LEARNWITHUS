// GET /api/blogs/[id] - Get blog by ID
// PUT /api/blogs/[id] - Update blog
// DELETE /api/blogs/[id] - Delete blog

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  Blog,
  User,
  Tag,
  ApiResponse 
} from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get blog by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Get blog
    const blogDoc = await adminDb.collection(COLLECTIONS.blogs).doc(id).get();

    if (!blogDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy blog', statusCode: 404 },
        { status: 404 }
      );
    }

    const blog = blogDoc.data() as Blog;

    // Check if published for public access
    const authHeader = request.headers.get('authorization');
    let payload = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      payload = verifyToken(token);
    }

    if (!blog.isPublished && (!payload || !['Staff', 'Manager', 'Admin'].includes(payload.role))) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Blog chưa được xuất bản', statusCode: 404 },
        { status: 404 }
      );
    }

    // Get author info
    if (blog.authorId) {
      const authorDoc = await adminDb
        .collection(COLLECTIONS.users)
        .doc(blog.authorId)
        .get();
      
      if (authorDoc.exists) {
        const author = authorDoc.data() as User;
        blog.author = {
          id: author.id,
          fullName: author.fullName,
          email: author.email,
          phone: author.phone,
          address: author.address,
          role: author.role,
          isActive: author.isActive,
          createdAt: author.createdAt
        };
      }
    }

    // Get tags
    const blogTagsSnapshot = await adminDb
      .collection('blogTags')
      .where('blogId', '==', id)
      .get();

    if (!blogTagsSnapshot.empty) {
      const tagIds = blogTagsSnapshot.docs.map(d => d.data().tagId);
      const tags: Tag[] = [];
      
      for (const tagId of tagIds) {
        const tagDoc = await adminDb.collection(COLLECTIONS.tags).doc(tagId).get();
        if (tagDoc.exists) {
          tags.push(tagDoc.data() as Tag);
        }
      }
      
      blog.tags = tags;
    }

    return NextResponse.json<ApiResponse<Blog>>(
      { data: blog, message: 'Lấy thông tin blog thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update blog
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

    // Only Staff, Manager, Admin can update blogs
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền cập nhật blog', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: {
      title?: string;
      content?: string;
      summary?: string;
      imageUrl?: string;
      tagIds?: string[];
      isPublished?: boolean;
    } = await request.json();

    // Get blog
    const blogDoc = await adminDb.collection(COLLECTIONS.blogs).doc(id).get();

    if (!blogDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy blog', statusCode: 404 },
        { status: 404 }
      );
    }

    const currentBlog = blogDoc.data() as Blog;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    
    if (body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
      // Set publishedAt when first published
      if (body.isPublished && !currentBlog.isPublished) {
        updateData.publishedAt = new Date();
      }
    }

    await adminDb.collection(COLLECTIONS.blogs).doc(id).update(updateData);

    // Update tags if provided
    if (body.tagIds !== undefined) {
      // Delete existing blog-tag relationships
      const existingTagsSnapshot = await adminDb
        .collection('blogTags')
        .where('blogId', '==', id)
        .get();

      const batch = adminDb.batch();
      
      existingTagsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Create new relationships
      for (const tagId of body.tagIds) {
        const blogTagRef = adminDb.collection('blogTags').doc();
        batch.set(blogTagRef, {
          id: blogTagRef.id,
          blogId: id,
          tagId,
          createdAt: new Date()
        });
      }

      await batch.commit();
    }

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật blog thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog
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

    // Only Admin can delete blogs
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền xóa blog', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Get blog
    const blogDoc = await adminDb.collection(COLLECTIONS.blogs).doc(id).get();

    if (!blogDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy blog', statusCode: 404 },
        { status: 404 }
      );
    }

    const batch = adminDb.batch();

    // Delete blog-tag relationships
    const blogTagsSnapshot = await adminDb
      .collection('blogTags')
      .where('blogId', '==', id)
      .get();

    blogTagsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete blog
    batch.delete(adminDb.collection(COLLECTIONS.blogs).doc(id));

    await batch.commit();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa blog thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
