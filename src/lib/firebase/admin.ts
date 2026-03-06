// Firebase Admin SDK Configuration
// Use this for server-side Firebase operations (API routes, Server Actions)

import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

/**
 * Get storage bucket name. Firebase projects:
 * - Created after Oct 2024: projectId.firebasestorage.app
 * - Older projects: projectId.appspot.com
 * Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local if upload fails with "bucket does not exist".
 */
function getStorageBucket(projectId: string): string {
  const envBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET;
  if (envBucket) return envBucket;
  return `${projectId}.firebasestorage.app`;
}

function initializeFirebaseAdmin() {
  if (getApps().length) return;

  // 1. FIREBASE_SERVICE_ACCOUNT (recommended for Vercel) - full JSON as string
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson) as admin.ServiceAccount & { project_id?: string; private_key?: string; client_email?: string };
      const projectId = parsed.project_id ?? parsed.projectId;
      let privateKey = parsed.private_key ?? parsed.privateKey;
      const clientEmail = parsed.client_email ?? parsed.clientEmail;
      if (projectId && privateKey && clientEmail) {
        if (typeof privateKey === 'string') {
          if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
          } else if (!privateKey.includes('\n') && privateKey.includes('-----BEGIN')) {
            privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n').replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
          }
        }
        const storageBucket = getStorageBucket(projectId);
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey } as admin.ServiceAccount),
          storageBucket,
        });
        console.log('✅ Firebase Admin initialized (FIREBASE_SERVICE_ACCOUNT)', { storageBucket });
        return;
      }
    } catch (e) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT parse error:', e);
    }
  }

  // 2. serviceAccountKey.json (local dev only - skip on Vercel)
  if (typeof process.env.VERCEL === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require('path');
      const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        const projectId = serviceAccount.project_id || serviceAccount.projectId;
        const storageBucket = getStorageBucket(projectId);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket,
        });
        console.log('✅ Firebase Admin initialized (serviceAccountKey.json)', { storageBucket });
        return;
      }
    } catch {
      // serviceAccountKey.json not available
    }
  }

  // 3. Individual env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠ Firebase Admin: missing env vars. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID+CLIENT_EMAIL+PRIVATE_KEY');
    return;
  }

  // Strip surrounding quotes, convert \n to newlines
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const storageBucket = getStorageBucket(projectId);
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey } as admin.ServiceAccount),
      storageBucket,
    });
    console.log('✅ Firebase Admin initialized (env vars)');
  } catch (error) {
    console.error('❌ Firebase Admin init failed:', error);
  }
}

function getFirebaseAdmin() {
  initializeFirebaseAdmin();
  if (!getApps().length) {
    throw new Error('Firebase Admin not initialized. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
  }
  return admin;
}

// Lazy getters - only initialize when actually called at runtime
export const adminDb = new Proxy({} as FirebaseFirestore.Firestore, {
  get(_, prop) { return Reflect.get(getFirebaseAdmin().firestore(), prop); },
});
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_, prop) { return Reflect.get(getFirebaseAdmin().auth(), prop); },
});
export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(_, prop) { return Reflect.get(getFirebaseAdmin().storage(), prop); },
});

// Firestore Collections
export const COLLECTIONS = {
  users: 'users',
  testServices: 'testServices',
  servicePrices: 'servicePrices',
  testBookings: 'testBookings',
  testKits: 'testKits',
  testSamples: 'testSamples',
  testResults: 'testResults',
  payments: 'payments',
  blogs: 'blogs',
  tags: 'tags',
  feedback: 'feedback',
  sampleInstructions: 'sampleInstructions',
  logistics: 'logistics',
  otpCodes: 'otpCodes',
  studyGroups: 'studyGroups',
  groupMembers: 'groupMembers',
  communityPosts: 'communityPosts',
  communityComments: 'communityComments',
  mentorRequests: 'mentorRequests',
  mentorBookings: 'mentorBookings',
  pomodoroSessions: 'pomodoroSessions',
} as const;

export default admin;