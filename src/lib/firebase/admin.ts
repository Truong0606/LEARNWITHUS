// Firebase Admin SDK Configuration
// Use this for server-side Firebase operations (API routes, Server Actions)

import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

function initializeFirebaseAdmin() {
  if (getApps().length) return;

  try {
    // Try serviceAccountKey.json first (local dev)
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
      console.log('✅ Firebase Admin initialized successfully');
      return;
    }
  } catch {
    // serviceAccountKey.json not available, try env vars
  }

  // Fallback: Use environment variables (Vercel / production)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠ Firebase Admin: missing env vars, skipping initialization (build-time is OK)');
    return;
  }

  // Handle various private key formats from env vars
  // Strip surrounding quotes if present (Vercel stores them literally)
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  // Convert literal \n to actual newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey } as admin.ServiceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase Admin initialized with env variables');
  } catch (error) {
    console.error('❌ Firebase Admin init failed with env vars:', error);
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

