// Firebase Admin SDK Configuration
// Use this for server-side Firebase operations (API routes, Server Actions)

import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

function initializeFirebaseAdmin() {
  if (getApps().length) return;

  // 1. FIREBASE_SERVICE_ACCOUNT (recommended for Vercel) - full JSON as string
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
        admin.initializeApp({  
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log('✅ Firebase Admin initialized (FIREBASE_SERVICE_ACCOUNT)');
        return;
      }
    } catch (e) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT parse error:', e);
    }
  }

  // 2. serviceAccountKey.json (local dev)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin initialized (serviceAccountKey.json)');
      return;
    }
  } catch {
    // serviceAccountKey.json not available
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
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey } as admin.ServiceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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
} as const;

export default admin;

