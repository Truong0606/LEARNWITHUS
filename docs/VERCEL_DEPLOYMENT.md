# Vercel Deployment Guide

This project now passes `npm run build` locally and is ready to deploy once the required Vercel environment variables are set.

## 0. Use one Firebase project consistently

Production Firebase project confirmed for this deployment:

```env
FIREBASE_PROJECT_ID=bloodline-dna-nextjs-eeffb
```

Important:

- `NEXT_PUBLIC_FIREBASE_*` values must come from `bloodline-dna-nextjs-eeffb`
- `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_*` admin values must also come from `bloodline-dna-nextjs-eeffb`
- Do not mix client config from one Firebase project with admin credentials from another

## 1. Required Vercel environment variables

Add these in Vercel under `Project Settings -> Environment Variables`.

### Public Firebase config

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

### App config

```env
NEXT_PUBLIC_APP_URL=
JWT_SECRET=
```

### PayOS

```env
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
PAYOS_BASE_URL=https://api-merchant.payos.vn
PAYOS_LOG=warn
```

### SMTP

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
SMTP_FROM_NAME=StudyHub
```

### Firebase Admin for server routes

Use one of the following approaches.

Preferred:

```env
FIREBASE_SERVICE_ACCOUNT=
```

Alternative:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_STORAGE_BUCKET=
```

### Optional admin protection

```env
SEED_SECRET=
```

## 2. Firebase Admin value format

### Option A: `FIREBASE_SERVICE_ACCOUNT`

Paste the full service account JSON as a single-line JSON string.

### Option B: individual keys

- `FIREBASE_PROJECT_ID`: Firebase project id
- `FIREBASE_CLIENT_EMAIL`: service account client email
- `FIREBASE_PRIVATE_KEY`: private key with newline characters escaped as `\n`

Example format:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
```

For this deployment, the split admin values should use:

```env
FIREBASE_PROJECT_ID=bloodline-dna-nextjs-eeffb
FIREBASE_STORAGE_BUCKET=bloodline-dna-nextjs-eeffb.firebasestorage.app
```

## 3. Before deploying

1. Make sure `NEXT_PUBLIC_APP_URL` is the real production URL, not `http://localhost:3000`.
2. In PayOS, register the production return and cancel URLs based on that domain.
3. Ensure Firebase Storage and Firestore permissions are set correctly for this app.
4. Rotate any secrets that were shared in chat or screenshots.

## 4. Deploy steps

1. Push the repository to GitHub.
2. Log in to Vercel.
3. Click `Add New -> Project`.
4. Import the GitHub repository.
5. Keep the detected framework as `Next.js`.
6. Do not override the build command unless needed. Default is fine.
7. Add all environment variables listed above.
8. Click `Deploy`.

## 5. After first deploy

1. Open the deployed site and verify the home page loads.
2. Test login and register.
3. Test forgot password email flow.
4. Test Firebase-backed uploads.
5. Test PayOS return and cancel flow.
6. If using the admin webhook registration endpoint, register the production webhook URL after deploy.

## 6. Verified local status

- `npm ci`: passed
- `npm run build`: passed

## 7. Notes

- The app uses Firebase Admin in server routes, so client-only Firebase variables are not enough.
- Local file storage is not used by the active upload endpoints; uploads go through Firebase Storage.