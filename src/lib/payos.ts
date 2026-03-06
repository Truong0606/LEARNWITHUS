/**
 * PayOS Integration - Using @payos/node SDK
 * Documentation: https://payos.vn/docs
 * SDK: https://github.com/payOSHQ/payos-lib-node
 */

import { PayOS } from '@payos/node';

// Initialize PayOS client
const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || '',
  apiKey: process.env.PAYOS_API_KEY || '',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
  baseURL: process.env.PAYOS_BASE_URL || 'https://api-merchant.payos.vn',
  logLevel: process.env.PAYOS_LOG as 'off' | 'error' | 'warn' | 'info' | 'debug' || 'warn',
});

// PayOS Configuration (for return/cancel URLs)
const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();
export const PAYOS_CONFIG = {
  clientId: process.env.PAYOS_CLIENT_ID || '',
  apiKey: process.env.PAYOS_API_KEY || '',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
  baseUrl: 'https://api-merchant.payos.vn',
  returnUrl: `${baseUrl}/payment/success`,
  cancelUrl: `${baseUrl}/payment/cancel`,
};

// Types (compatible with existing code)
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
  expiredAt?: number;
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
  return parseInt(`${timestamp}${random}`.slice(-12), 10);
}

// Verify webhook signature using PayOS SDK
export async function verifyWebhookSignature(
  webhookBody: { code?: string; desc?: string; success?: boolean; data?: PayOSWebhookData; signature?: string }
): Promise<boolean> {
  if (!webhookBody?.data || !webhookBody?.signature) return false;
  try {
    await payos.webhooks.verify({
      code: webhookBody.code ?? '',
      desc: webhookBody.desc ?? '',
      success: webhookBody.success ?? false,
      data: webhookBody.data,
      signature: webhookBody.signature,
    });
    return true;
  } catch {
    return false;
  }
}

// Create payment link using PayOS SDK
export async function createPaymentLink(
  paymentData: Omit<PayOSPaymentData, 'signature'>
): Promise<PayOSResponse> {
  try {
    const paymentLink = await payos.paymentRequests.create({
      orderCode: paymentData.orderCode,
      amount: paymentData.amount,
      description: paymentData.description,
      returnUrl: paymentData.returnUrl,
      cancelUrl: paymentData.cancelUrl,
      items: paymentData.items,
      buyerName: paymentData.buyerName,
      buyerEmail: paymentData.buyerEmail,
      buyerPhone: paymentData.buyerPhone,
      buyerAddress: paymentData.buyerAddress,
      expiredAt: paymentData.expiredAt,
    });

    return {
      code: '00',
      desc: 'success',
      data: {
        bin: paymentLink.bin,
        accountNumber: paymentLink.accountNumber,
        accountName: paymentLink.accountName,
        amount: paymentLink.amount,
        description: paymentLink.description,
        orderCode: paymentLink.orderCode,
        currency: paymentLink.currency,
        paymentLinkId: paymentLink.paymentLinkId,
        status: paymentLink.status,
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
      },
    };
  } catch (err) {
    const error = err as { code?: string; desc?: string; message?: string };
    return {
      code: error.code || '99',
      desc: error.desc || error.message || 'Lỗi tạo thanh toán',
    };
  }
}

// Get payment info using PayOS SDK
export async function getPaymentInfo(orderCode: number): Promise<PayOSResponse> {
  try {
    const paymentLink = await payos.paymentRequests.get(orderCode);
    return {
      code: '00',
      desc: 'success',
      data: {
        bin: '',
        accountNumber: '',
        accountName: '',
        amount: paymentLink.amount,
        description: '',
        orderCode: paymentLink.orderCode,
        currency: 'VND',
        paymentLinkId: paymentLink.id,
        status: paymentLink.status,
        checkoutUrl: '',
        qrCode: '',
      },
    };
  } catch (err) {
    const error = err as { code?: string; desc?: string; message?: string };
    return {
      code: error.code || '99',
      desc: error.desc || error.message || 'Lỗi lấy thông tin thanh toán',
    };
  }
}

// Cancel payment link using PayOS SDK
export async function cancelPaymentLink(
  orderCode: number,
  reason?: string
): Promise<PayOSResponse> {
  try {
    await payos.paymentRequests.cancel(orderCode, reason || 'User cancelled');
    return { code: '00', desc: 'success' };
  } catch (err) {
    const error = err as { code?: string; desc?: string; message?: string };
    return {
      code: error.code || '99',
      desc: error.desc || error.message || 'Lỗi hủy thanh toán',
    };
  }
}

// Calculate deposit amount (30% of total)
export function calculateDepositAmount(totalAmount: number): number {
  return Math.round(totalAmount * 0.3);
}

// Calculate remaining amount (70% of total)
export function calculateRemainingAmount(totalAmount: number): number {
  return totalAmount - calculateDepositAmount(totalAmount);
}

// Register webhook URL with PayOS (call once from admin panel)
export async function confirmWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  try {
    await payos.webhooks.confirm(webhookUrl);
    return { success: true, message: `Webhook đã được đăng ký: ${webhookUrl}` };
  } catch (err) {
    const error = err as { code?: string; desc?: string; message?: string };
    return {
      success: false,
      message: error.desc || error.message || 'Lỗi đăng ký webhook',
    };
  }
}
