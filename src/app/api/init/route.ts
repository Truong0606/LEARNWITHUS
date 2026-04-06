
import { NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { hashPassword } from '@/lib/utils';
import { UserRole } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const passwordHash = await hashPassword('123456');
    const now = FieldValue.serverTimestamp();

    const users = [
      {
        fullName: 'Quản trị viên',
        email: 'admin@gmail.com',
        role: 1, // Admin (Staff value = 1)
        isActive: true,
      },
      {
        fullName: 'Mentor Nguyễn Khang',
        email: 'nguyenkhang@gmail.com',
        role: 4, // Mentor
        isActive: true,
      },
      {
        fullName: 'Phan Văn Bin VIP',
        email: 'phanvanbin2321@gmail.com',
        role: 2, // Client
        isActive: true,
        vipPlan: 'yearly',
        vipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      {
        fullName: 'Sinh viên Nguyễn Khang',
        email: 'nguyenkhang123@gmail.com',
        role: 2, // Client
        isActive: true,
      },
    ];

    const results = [];

    for (const userData of users) {
      const snap = await adminDb.collection(COLLECTIONS.users).where('email', '==', userData.email.toLowerCase()).get();
      
      if (snap.empty) {
        const docRef = adminDb.collection(COLLECTIONS.users).doc();
        await docRef.set({
          ...userData,
          id: docRef.id,
          phone: '0901234567',
          address: 'Hồ Chí Minh',
          passwordHash,
          createdAt: now,
          updatedAt: now,
        });
        results.push(`Created: ${userData.email}`);
      } else {
        const docId = snap.docs[0].id;
        await adminDb.collection(COLLECTIONS.users).doc(docId).update({
          ...userData,
          passwordHash,
          updatedAt: now,
        });
        results.push(`Updated: ${userData.email}`);
      }
    }

    return NextResponse.json({
      message: 'Khởi tạo tài khoản thành công! Bạn có thể thử đăng nhập ngay.',
      details: results,
      note: 'Hãy xóa file này sau khi chạy xong để đảm bảo bảo mật.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
