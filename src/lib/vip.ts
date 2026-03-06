// VIP status helpers (server-side, use in API routes)

import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { User, VipPlanId } from '@/types';

export interface VipStatus {
  isVip: boolean;
  vipPlan: VipPlanId | null;
  vipExpiresAt: Date | null;
}

/**
 * Check a user's VIP status from Firestore.
 * Returns { isVip, vipPlan, vipExpiresAt }.
 */
export async function getUserVipStatus(userId: string): Promise<VipStatus> {
  const userDoc = await adminDb.collection(COLLECTIONS.users).doc(userId).get();
  if (!userDoc.exists) return { isVip: false, vipPlan: null, vipExpiresAt: null };

  const user = userDoc.data() as User;
  const now = new Date();

  const vipExpiresAt = user.vipExpiresAt
    ? user.vipExpiresAt instanceof Timestamp
      ? (user.vipExpiresAt as unknown as Timestamp).toDate()
      : new Date(user.vipExpiresAt)
    : null;

  const isVip = !!(vipExpiresAt && vipExpiresAt > now);

  return {
    isVip,
    vipPlan: isVip ? (user.vipPlan ?? null) : null,
    vipExpiresAt,
  };
}

/**
 * Get VIP status from an already-fetched User document (avoids extra Firestore read).
 */
export function getVipStatusFromUser(user: User): VipStatus {
  const now = new Date();

  const vipExpiresAt = user.vipExpiresAt
    ? user.vipExpiresAt instanceof Timestamp
      ? (user.vipExpiresAt as unknown as Timestamp).toDate()
      : new Date(user.vipExpiresAt)
    : null;

  const isVip = !!(vipExpiresAt && vipExpiresAt > now);

  return {
    isVip,
    vipPlan: isVip ? (user.vipPlan ?? null) : null,
    vipExpiresAt,
  };
}

/**
 * Returns the current month key in "YYYY-MM" format.
 */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
