// Utility functions

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind merge helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// JWT Secret (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '2h'; // Changed to 2h to match BE

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT helpers
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  userName: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// OTP generation
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

// OTP hashing (using SHA256 like BE)
export function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code, 'utf8').digest('base64');
}

// Verify OTP
export function verifyOTP(inputCode: string, storedHash: string): boolean {
  const inputHash = hashOTP(inputCode);
  return inputHash === storedHash;
}

// Generate Sample Code (like BE SampleCodeHelper)
export function generateSampleCode(): string {
  const ms = Date.now().toString().slice(-3); // Last 3 digits of milliseconds
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `SMP-${ms}${rand}`;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone format (Vietnamese)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Format currency VND
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

// Format date Vietnamese style
export function formatDateVN(date: Date | string): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
}

// Format datetime Vietnamese style
export function formatDateTimeVN(date: Date | string): string {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Slugify string
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Sleep helper
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Error response helper
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export function createErrorResponse(message: string, statusCode: number = 400): ApiError {
  return { message, statusCode };
}

// Success response helper
export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    data,
    message: message || 'Success',
    statusCode: 200
  };
}

