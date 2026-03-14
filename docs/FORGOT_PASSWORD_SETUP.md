# Hướng dẫn cấu hình chức năng "Quên Mật Khẩu"

Chức năng Quên Mật Khẩu gửi mã OTP qua email để người dùng đặt lại mật khẩu.

## 1. Biến môi trường (Environment Variables)

Thêm vào file `.env.local`:

```env
# SMTP - Gửi email OTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@studyhub.vn
SMTP_FROM_NAME=StudyHub
```

## 2. Cấu hình Gmail (nếu dùng Gmail)

1. Bật **2-Step Verification** cho tài khoản Google: https://myaccount.google.com/security
2. Tạo **App Password**:
   - Vào https://myaccount.google.com/apppasswords
   - Chọn "Mail" và thiết bị
   - Copy mật khẩu 16 ký tự
3. Đặt `SMTP_USER` = email Gmail của bạn
4. Đặt `SMTP_PASSWORD` = App Password (không dùng mật khẩu đăng nhập thường)

## 3. Cấu hình SMTP khác (SendGrid, Mailgun, etc.)

| Nhà cung cấp | SMTP_HOST | SMTP_PORT |
|--------------|-----------|-----------|
| Gmail | smtp.gmail.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |
| Outlook | smtp.office365.com | 587 |

## 4. Firestore - Collection `otpCodes`

Đảm bảo Firestore có collection `otpCodes` với cấu trúc:

- `userId`: string
- `hashedCode`: string
- `deliveryMethod`: number (0 = Email)
- `purpose`: number (0 = ResetPassword)
- `expiresAt`: Timestamp
- `isUsed`: boolean
- `sentTo`: string (email)
- `createdAt`, `updatedAt`: Timestamp

## 5. Luồng hoạt động

1. User nhập email tại `/forgot-password`
2. API `/api/auth/forgot-password` tìm user, tạo OTP, lưu vào Firestore, gửi email
3. User nhập OTP tại `/reset-password?email=...`
4. API `/api/auth/reset-password` xác thực OTP và cập nhật mật khẩu mới

## 6. Chế độ Development

Trong `NODE_ENV=development`, API trả về `devOtp` trong response để test mà không cần kiểm tra email thật.

## 7. Kiểm tra

- Gọi `POST /api/email/test` với `{ "type": "otp", "to": "your@email.com" }` (cần token Admin)
- Hoặc test flow đầy đủ qua UI `/forgot-password`
