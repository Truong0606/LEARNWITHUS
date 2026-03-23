// Firestore Helper Functions
// Common operations for Firestore

import { adminDb, COLLECTIONS } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Generate unique ID (similar to BE pattern)
export function generateId(): string {
  const ticks = new Date(2025, 3, 30).getTime(); // April 30, 2025
  const ans = Date.now() - ticks;
  const randomPart = Math.floor(Math.random() * 9000) + 1000;
  return (ans.toString(16) + randomPart.toString()).toUpperCase();
}

// Convert Firestore Timestamp-like values to Date
export function timestampToDate(timestamp: unknown): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }

  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  if (timestamp && typeof timestamp === 'object') {
    if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }

    const seconds =
      'seconds' in timestamp && typeof timestamp.seconds === 'number'
        ? timestamp.seconds
        : '_seconds' in timestamp && typeof timestamp._seconds === 'number'
          ? timestamp._seconds
          : null;

    if (seconds !== null) {
      return new Date(seconds * 1000);
    }
  }

  return new Date(NaN);
}

// Convert Date to Firestore Timestamp
export function dateToTimestamp(date: Date | string): Timestamp {
  return Timestamp.fromDate(new Date(date));
}

// Base document with timestamps
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Create document with auto ID and timestamps
export async function createDocument<T extends object>(
  collection: string,
  data: T
): Promise<string> {
  const id = generateId();
  const now = FieldValue.serverTimestamp();
  
  await adminDb.collection(collection).doc(id).set({
    ...data,
    id,
    createdAt: now,
    updatedAt: now
  });
  
  return id;
}

// Get document by ID
export async function getDocument<T>(
  collection: string,
  id: string
): Promise<T | null> {
  const doc = await adminDb.collection(collection).doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return doc.data() as T;
}

// Update document
export async function updateDocument<T extends object>(
  collection: string,
  id: string,
  data: Partial<T>
): Promise<boolean> {
  const docRef = adminDb.collection(collection).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return false;
  }
  
  await docRef.update({
    ...data,
    updatedAt: FieldValue.serverTimestamp()
  });
  
  return true;
}

// Delete document
export async function deleteDocument(
  collection: string,
  id: string
): Promise<boolean> {
  const docRef = adminDb.collection(collection).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return false;
  }
  
  await docRef.delete();
  return true;
}

// Get all documents from collection
export async function getAllDocuments<T>(
  collection: string,
  options?: {
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    limit?: number;
    where?: {
      field: string;
      operator: FirebaseFirestore.WhereFilterOp;
      value: unknown;
    }[];
  }
): Promise<T[]> {
  let query: FirebaseFirestore.Query = adminDb.collection(collection);
  
  // Apply where filters
  if (options?.where) {
    for (const condition of options.where) {
      query = query.where(condition.field, condition.operator, condition.value);
    }
  }
  
  // Apply ordering
  if (options?.orderBy) {
    query = query.orderBy(options.orderBy, options.orderDirection || 'desc');
  }
  
  // Apply limit
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => doc.data() as T);
}

// Paginated query
export async function getPaginatedDocuments<T>(
  collection: string,
  options: {
    pageSize: number;
    lastDocId?: string;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    where?: {
      field: string;
      operator: FirebaseFirestore.WhereFilterOp;
      value: unknown;
    }[];
  }
): Promise<{ items: T[]; lastDocId: string | null; hasMore: boolean }> {
  let query: FirebaseFirestore.Query = adminDb.collection(collection);
  
  // Apply where filters
  if (options.where) {
    for (const condition of options.where) {
      query = query.where(condition.field, condition.operator, condition.value);
    }
  }
  
  // Apply ordering
  const orderField = options.orderBy || 'createdAt';
  query = query.orderBy(orderField, options.orderDirection || 'desc');
  
  // Start after last document if paginating
  if (options.lastDocId) {
    const lastDoc = await adminDb.collection(collection).doc(options.lastDocId).get();
    if (lastDoc.exists) {
      query = query.startAfter(lastDoc);
    }
  }
  
  // Get one more than needed to check if there are more
  query = query.limit(options.pageSize + 1);
  
  const snapshot = await query.get();
  const docs = snapshot.docs;
  const hasMore = docs.length > options.pageSize;
  
  // Remove the extra document
  if (hasMore) {
    docs.pop();
  }
  
  const items = docs.map(doc => doc.data() as T);
  const lastDocId = docs.length > 0 ? docs[docs.length - 1].id : null;
  
  return { items, lastDocId, hasMore };
}

// Batch write helper
export async function batchWrite(
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    id?: string;
    data?: object;
  }>
): Promise<void> {
  const batch = adminDb.batch();
  const now = FieldValue.serverTimestamp();
  
  for (const op of operations) {
    const id = op.id || generateId();
    const docRef = adminDb.collection(op.collection).doc(id);
    
    switch (op.type) {
      case 'create':
        batch.set(docRef, {
          ...op.data,
          id,
          createdAt: now,
          updatedAt: now
        });
        break;
      case 'update':
        batch.update(docRef, {
          ...op.data,
          updatedAt: now
        });
        break;
      case 'delete':
        batch.delete(docRef);
        break;
    }
  }
  
  await batch.commit();
}

// Count documents
export async function countDocuments(
  collection: string,
  where?: {
    field: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: unknown;
  }[]
): Promise<number> {
  let query: FirebaseFirestore.Query = adminDb.collection(collection);
  
  if (where) {
    for (const condition of where) {
      query = query.where(condition.field, condition.operator, condition.value);
    }
  }
  
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

// Export collections reference
export { COLLECTIONS };

