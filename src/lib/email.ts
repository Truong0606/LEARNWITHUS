// Email Service - Send notifications via SMTP
// Uses Nodemailer for SMTP integration

import nodemailer from 'nodemailer';
import { BookingStatus, BookingStatusLabels } from '@/types';

// Email Configuration - Gmail App Password works with port 587 + STARTTLS
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
  tls: {
    rejectUnauthorized: true,
  },
};

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@studyhub.vn';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'StudyHub';

// Create transporter - use service 'gmail' when host is Gmail for better compatibility
const transporter = nodemailer.createTransport(
  process.env.SMTP_HOST === 'smtp.gmail.com' || !process.env.SMTP_HOST
    ? { service: 'gmail', auth: EMAIL_CONFIG.auth }
    : EMAIL_CONFIG
);

// Email Templates
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// Base HTML template
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StudyHub</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .info-box { background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .highlight { color: #2563eb; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 StudyHub</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Nền tảng học tập cộng đồng</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2024 StudyHub. All rights reserved.</p>
      <p>Email: support@studyhub.vn</p>
      <p style="margin-top: 10px;">
        <a href="#" style="color: #2563eb; text-decoration: none;">Website</a> | 
        <a href="#" style="color: #2563eb; text-decoration: none;">Facebook</a> | 
        <a href="#" style="color: #2563eb; text-decoration: none;">Zalo</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// OTP Email Template
export function otpEmailTemplate(otp: string, purpose: 'reset' | 'verify'): EmailTemplate {
  const purposeText = purpose === 'reset' 
    ? 'đặt lại mật khẩu' 
    : 'xác thực tài khoản';

  const content = `
    <h2>Mã xác thực của bạn</h2>
    <p>Xin chào,</p>
    <p>Bạn đã yêu cầu ${purposeText}. Dưới đây là mã OTP của bạn:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background-color: #f1f5f9; padding: 20px 40px; border-radius: 10px; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #2563eb;">
        ${otp}
      </div>
    </div>
    
    <p><strong>⏰ Mã này sẽ hết hạn sau 5 phút.</strong></p>
    
    <div class="info-box">
      <p style="margin: 0;">⚠️ <strong>Lưu ý bảo mật:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Không chia sẻ mã này với bất kỳ ai</li>
        <li>StudyHub không bao giờ yêu cầu mã OTP qua điện thoại</li>
        <li>Nếu bạn không yêu cầu mã này, hãy bỏ qua email</li>
      </ul>
    </div>
  `;

  return {
    subject: `[Bloodline DNA] Mã xác thực ${purposeText}`,
    html: baseTemplate(content),
    text: `Mã OTP của bạn là: ${otp}. Mã này sẽ hết hạn sau 5 phút.`
  };
}

// Booking Status Update Email Template
export function bookingStatusTemplate(
  clientName: string,
  bookingId: string,
  serviceName: string,
  status: BookingStatus
): EmailTemplate {
  const statusLabel = BookingStatusLabels[status] || 'Đang xử lý';
  
  let statusMessage = '';
  let actionButton = '';
  
  switch (status) {
    case BookingStatus.DepositPaid:
      statusMessage = 'Đơn hàng của bạn đã được thanh toán đặt cọc thành công. Chúng tôi đang chuẩn bị kit xét nghiệm.';
      break;
    case BookingStatus.KitDelivering:
      statusMessage = 'Kit xét nghiệm đang được giao đến địa chỉ của bạn. Vui lòng kiểm tra điện thoại để nhận thông báo từ nhân viên giao hàng.';
      break;
    case BookingStatus.KitDelivered:
      statusMessage = 'Kit xét nghiệm đã được giao thành công. Vui lòng thực hiện lấy mẫu theo hướng dẫn trong kit.';
      actionButton = '<a href="#" class="button">Xem hướng dẫn lấy mẫu</a>';
      break;
    case BookingStatus.SampleReceived:
      statusMessage = 'Mẫu xét nghiệm của bạn đã được tiếp nhận tại phòng lab. Quá trình xét nghiệm sẽ bắt đầu ngay.';
      break;
    case BookingStatus.Testing:
      statusMessage = 'Mẫu của bạn đang được xét nghiệm. Thời gian dự kiến có kết quả là 5-7 ngày làm việc.';
      break;
    case BookingStatus.ResultReady:
      statusMessage = 'Kết quả xét nghiệm của bạn đã sẵn sàng! Vui lòng thanh toán số tiền còn lại để nhận kết quả.';
      actionButton = '<a href="#" class="button">Thanh toán và xem kết quả</a>';
      break;
    case BookingStatus.Completed:
      statusMessage = 'Đơn hàng của bạn đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ của Bloodline DNA!';
      actionButton = '<a href="#" class="button">Đánh giá dịch vụ</a>';
      break;
    case BookingStatus.Cancelled:
      statusMessage = 'Đơn hàng của bạn đã bị hủy. Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi.';
      break;
    default:
      statusMessage = 'Trạng thái đơn hàng của bạn đã được cập nhật.';
  }

  const content = `
    <h2>Cập nhật đơn hàng</h2>
    <p>Xin chào <span class="highlight">${clientName}</span>,</p>
    
    <div class="info-box">
      <p><strong>Mã đơn hàng:</strong> ${bookingId.slice(-8).toUpperCase()}</p>
      <p><strong>Dịch vụ:</strong> ${serviceName}</p>
      <p><strong>Trạng thái mới:</strong> <span class="highlight">${statusLabel}</span></p>
    </div>
    
    <p>${statusMessage}</p>
    
    ${actionButton ? `<div style="text-align: center;">${actionButton}</div>` : ''}
    
    <p style="margin-top: 30px;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua hotline <strong>1900 xxxx</strong>.</p>
    
    <p>Trân trọng,<br><strong>Đội ngũ Bloodline DNA</strong></p>
  `;

  return {
    subject: `[Bloodline DNA] Cập nhật đơn hàng #${bookingId.slice(-8).toUpperCase()} - ${statusLabel}`,
    html: baseTemplate(content),
    text: `Đơn hàng ${bookingId} của bạn đã được cập nhật sang trạng thái: ${statusLabel}. ${statusMessage}`
  };
}

// Result Ready Email Template
export function resultReadyTemplate(
  clientName: string,
  bookingId: string,
  serviceName: string,
  resultUrl?: string
): EmailTemplate {
  const content = `
    <h2>🎉 Kết quả xét nghiệm đã sẵn sàng!</h2>
    <p>Xin chào <span class="highlight">${clientName}</span>,</p>
    
    <p>Chúng tôi vui mừng thông báo kết quả xét nghiệm ADN của bạn đã hoàn thành!</p>
    
    <div class="info-box">
      <p><strong>Mã đơn hàng:</strong> ${bookingId.slice(-8).toUpperCase()}</p>
      <p><strong>Dịch vụ:</strong> ${serviceName}</p>
    </div>
    
    <p>Để nhận kết quả, bạn cần thanh toán số tiền còn lại của đơn hàng.</p>
    
    <div style="text-align: center;">
      <a href="${resultUrl || '#'}" class="button">Thanh toán và xem kết quả</a>
    </div>
    
    <div class="info-box" style="background-color: #fef3c7; border-left: 4px solid #f59e0b;">
      <p style="margin: 0;">⚠️ <strong>Lưu ý:</strong> Kết quả xét nghiệm là thông tin y khoa quan trọng. Vui lòng bảo mật và không chia sẻ với người không liên quan.</p>
    </div>
    
    <p style="margin-top: 30px;">Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của Bloodline DNA!</p>
    
    <p>Trân trọng,<br><strong>Đội ngũ Bloodline DNA</strong></p>
  `;

  return {
    subject: `[Bloodline DNA] 🎉 Kết quả xét nghiệm #${bookingId.slice(-8).toUpperCase()} đã sẵn sàng!`,
    html: baseTemplate(content),
    text: `Kết quả xét nghiệm của bạn đã sẵn sàng! Mã đơn hàng: ${bookingId}. Vui lòng thanh toán để nhận kết quả.`
  };
}

// Welcome Email Template
export function welcomeEmailTemplate(fullName: string): EmailTemplate {
  const content = `
    <h2>Chào mừng đến với Bloodline DNA! 🎉</h2>
    <p>Xin chào <span class="highlight">${fullName}</span>,</p>
    
    <p>Cảm ơn bạn đã đăng ký tài khoản tại Bloodline DNA - Dịch vụ xét nghiệm ADN chuyên nghiệp và uy tín hàng đầu Việt Nam.</p>
    
    <div class="info-box">
      <h3 style="margin-top: 0;">✨ Với tài khoản của bạn, bạn có thể:</h3>
      <ul style="padding-left: 20px;">
        <li>Đặt lịch xét nghiệm ADN trực tuyến</li>
        <li>Theo dõi tiến trình đơn hàng</li>
        <li>Xem và tải kết quả xét nghiệm</li>
        <li>Quản lý thông tin cá nhân</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="#" class="button">Khám phá dịch vụ</a>
    </div>
    
    <p>Nếu bạn cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi qua:</p>
    <ul>
      <li>Hotline: <strong>1900 xxxx</strong></li>
      <li>Email: <strong>support@bloodline-dna.vn</strong></li>
      <li>Zalo: <strong>Bloodline DNA</strong></li>
    </ul>
    
    <p>Trân trọng,<br><strong>Đội ngũ Bloodline DNA</strong></p>
  `;

  return {
    subject: '[Bloodline DNA] Chào mừng bạn đến với Bloodline DNA! 🧬',
    html: baseTemplate(content),
    text: `Chào mừng ${fullName} đến với Bloodline DNA! Cảm ơn bạn đã đăng ký tài khoản.`
  };
}

// Send email function
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Check if SMTP is configured
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      return { success: false, error: 'SMTP not configured' };
    }

    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

// Convenience functions
export async function sendOtpEmail(to: string, otp: string, purpose: 'reset' | 'verify') {
  return sendEmail(to, otpEmailTemplate(otp, purpose));
}

export async function sendBookingStatusEmail(
  to: string,
  clientName: string,
  bookingId: string,
  serviceName: string,
  status: BookingStatus
) {
  return sendEmail(to, bookingStatusTemplate(clientName, bookingId, serviceName, status));
}

export async function sendResultReadyEmail(
  to: string,
  clientName: string,
  bookingId: string,
  serviceName: string,
  resultUrl?: string
) {
  return sendEmail(to, resultReadyTemplate(clientName, bookingId, serviceName, resultUrl));
}

export async function sendWelcomeEmail(to: string, fullName: string) {
  return sendEmail(to, welcomeEmailTemplate(fullName));
}
