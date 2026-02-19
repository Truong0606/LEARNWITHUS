# Hướng dẫn cấu hình Environment Variables trên Vercel

Để kết nối Firebase (đăng ký, đăng nhập, nhóm học, community...) trên Vercel, cần cấu hình đúng các biến môi trường.

## Cách 1: FIREBASE_SERVICE_ACCOUNT (Khuyến nghị - ổn định nhất)

1. Chạy script (trên máy local, có file serviceAccountKey.json):
   ```bash
   node scripts/get-vercel-env.js
   ```
2. Copy **toàn bộ** output (1 dòng JSON)
3. Vào Vercel Dashboard > Project > Settings > Environment Variables
4. Thêm biến mới:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** Paste JSON đã minify (1 dòng)
   - **Environments:** Production, Preview, Development
   - **Sensitive:** Bật ON
5. Save và Redeploy

### Ví dụ JSON minify (1 dòng):
```json
{"type":"service_account","project_id":"bloodline-dna-nextjs","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@bloodline-dna-nextjs.iam.gserviceaccount.com",...}
```

## Cách 2: Biến riêng lẻ

Nếu không dùng FIREBASE_SERVICE_ACCOUNT, thêm 3 biến:

| Key | Value |
|-----|-------|
| FIREBASE_PROJECT_ID | `bloodline-dna-nextjs` |
| FIREBASE_CLIENT_EMAIL | `firebase-adminsdk-fbsvc@bloodline-dna-nextjs.iam.gserviceaccount.com` |
| FIREBASE_PRIVATE_KEY | Paste private key (KHÔNG có dấu `"` bọc ngoài, giữ `\n` trong chuỗi) |

## Các biến bắt buộc khác

| Key | Mô tả |
|-----|-------|
| NEXT_PUBLIC_FIREBASE_API_KEY | API key từ Firebase Console |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | bloodline-dna-nextjs.firebaseapp.com |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | bloodline-dna-nextjs |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | bloodline-dna-nextjs.firebasestorage.app |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Sender ID |
| NEXT_PUBLIC_FIREBASE_APP_ID | App ID |
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | G-XXXXXXXX |
| JWT_SECRET | Chuỗi bí mật cho JWT (tùy chọn mạnh) |

## Sau khi cấu hình

1. Vào **Deployments** > chọn deployment mới nhất > **Redeploy**
2. Chọn **Redeploy** (không dùng cache)
3. Đợi build xong
