// PayOS Integration Helper
// Documentation: https://payos.vn/docs

import crypto from 'crypto';

// PayOS Configuration
export const PAYOS_CONFIG = {
  clientId: process.env.PAYOS_CLIENT_ID || '',
  apiKey: process.env.PAYOS_API_KEY || '',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
  baseUrl: 'https://api-merchant.payos.vn',
  returnUrl: process.env.NEXT_PUBLIC_APP_URL + '/payment/success',
  cancelUrl: process.env.NEXT_PUBLIC_APP_URL + '/payment/cancel',
};

// Payment types
export interface PayOSPaymentData {
  orderCode: number;
  amount: number;
  description: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  items?: PayOSItem[];
  returnUrl: string;
  cancelUrl: string;
  expiredAt?: number; // Unix timestamp
  signature?: string;
}

export interface PayOSItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PayOSResponse {
  code: string;
  desc: string;
  data?: {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
  };
  signature?: string;
}

export interface PayOSWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string;
  counterAccountBankName?: string;
  counterAccountName?: string;
  counterAccountNumber?: string;
  virtualAccountName?: string;
  virtualAccountNumber?: string;
}

// Generate order code (unique 6-12 digit number)
export function generateOrderCode(): number {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return parseInt(`${timestamp}${random}`.slice(-12));
}

// Create signature for PayOS request
export function createSignature(data: Record<string, unknown>): string {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(data).sort();
  
  // Build query string
  const queryString = sortedKeys
    .map(key => `${key}=${data[key]}`)
    .join('&');
  
  // Create HMAC SHA256 signature
  const hmac = crypto.createHmac('sha256', PAYOS_CONFIG.checksumKey);
  hmac.update(queryString);
  
  return hmac.digest('hex');
}

// Verify webhook signature
export function verifyWebhookSignature(data: PayOSWebhookData, signature: string): boolean {
  const expectedSignature = createSignature(data as unknown as Record<string, unknown>);
  return expectedSignature === signature;
}

// Create payment link
export async function createPaymentLink(paymentData: Omit<PayOSPaymentData, 'signature'>): Promise<PayOSResponse> {
  // Create signature
  const dataForSignature = {
    amount: paymentData.amount,
    cancelUrl: paymentData.cancelUrl,
    description: paymentData.description,
    orderCode: paymentData.orderCode,
    returnUrl: paymentData.returnUrl,
  };
  
  const signature = createSignature(dataForSignature);
  
  const requestBody = {
    ...paymentData,
    signature,
  };
  
  const response = await fetch(`${PAYOS_CONFIG.baseUrl}/v2/payment-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': PAYOS_CONFIG.clientId,
      'x-api-key': PAYOS_CONFIG.apiKey,
    },
    body: JSON.stringify(requestBody),
  });
  
  return response.json();
}

// Get payment info
export async function getPaymentInfo(orderCode: number): Promise<PayOSResponse> {
  const response = await fetch(`${PAYOS_CONFIG.baseUrl}/v2/payment-requests/${orderCode}`, {
    method: 'GET',
    headers: {
      'x-client-id': PAYOS_CONFIG.clientId,
      'x-api-key': PAYOS_CONFIG.apiKey,
    },
  });
  
  return response.json();
}

// Cancel payment link
export async function cancelPaymentLink(orderCode: number, reason?: string): Promise<PayOSResponse> {
  const response = await fetch(`${PAYOS_CONFIG.baseUrl}/v2/payment-requests/${orderCode}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': PAYOS_CONFIG.clientId,
      'x-api-key': PAYOS_CONFIG.apiKey,
    },
    body: JSON.stringify({ cancellationReason: reason || 'User cancelled' }),
  });
  
  return response.json();
}

// Calculate deposit amount (30% of total)
export function calculateDepositAmount(totalAmount: number): number {
  return Math.round(totalAmount * 0.3);
}

// Calculate remaining amount (70% of total)
export function calculateRemainingAmount(totalAmount: number): number {
  return totalAmount - calculateDepositAmount(totalAmount);
}
