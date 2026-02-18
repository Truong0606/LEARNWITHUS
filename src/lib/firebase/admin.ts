// Firebase Admin SDK Configuration
// Use this for server-side Firebase operations (API routes, Server Actions)

import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin (prevent duplicate initialization)
if (!getApps().length) {
  try {
    // Get the absolute path to serviceAccountKey.json in the project root
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    
    // Check if file exists
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccountContent = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountContent);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      // Fallback: Use environment variables
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin initialized with env variables');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin. Check serviceAccountKey.json or environment variables.');
  }
}

// Firebase Admin services
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();

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

