/**
 * Local file upload - saves to public/uploads/ (no Firebase Storage needed)
 * Works: local dev, self-hosted Node.js
 * Does NOT work: Vercel serverless (read-only filesystem)
 */

import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = 'public/uploads';

/**
 * Save file to public/uploads and return public URL
 */
export async function saveToLocal(
  buffer: Buffer,
  folder: string,
  userId: string,
  ext: string
): Promise<string> {
  const dir = path.join(process.cwd(), UPLOAD_DIR, folder, userId);
  const fileName = `${Date.now()}.${ext}`;
  const filePath = path.join(dir, fileName);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${folder}/${userId}/${fileName}`;
}
