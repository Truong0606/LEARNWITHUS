import { adminStorage } from './admin';

/**
 * Upload buffer to Firebase Cloud Storage using Admin SDK
 * Saves to: {folder}/{userId}/{timestamp}.{ext}
 */
export async function uploadToCloud(
  buffer: Buffer,
  folder: string,
  userId: string,
  ext: string,
  contentType: string
): Promise<string> {
  const bucket = adminStorage.bucket();
  const timestamp = Date.now();
  const filePath = `${folder}/${userId}/${timestamp}.${ext}`;
  const file = bucket.file(filePath);

  // Upload file
  await file.save(buffer, {
    metadata: {
      contentType: contentType,
      metadata: {
        firebaseStorageDownloadTokens: crypto.randomUUID(), // Recommended for SDKs
      }
    },
    // Keep it private by default, but we'll use a public-compatible URL format or signed URL
  });

  // Make the file publicly readable for web consumption
  await file.makePublic();

  // Return the public URL
  // Format: https://storage.googleapis.com/{bucket}/{filePath}
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

/**
 * Delete a file from Firebase Cloud Storage
 * @param url The public URL of the file
 */
export async function deleteFromCloud(url: string): Promise<boolean> {
  try {
    if (!url || !url.includes('storage.googleapis.com')) return false;

    const bucket = adminStorage.bucket();
    // Ex: https://storage.googleapis.com/bucket-name/folder/userId/timestamp.ext
    // Path starts after bucket.name/
    const urlParts = url.split(`${bucket.name}/`); 
    if (urlParts.length < 2) return false;
    
    const filePath = decodeURIComponent(urlParts[1]);
    const file = bucket.file(filePath);
    
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      return true;
    }
  } catch (error) {
    console.error('Delete from cloud error:', error);
  }
  return false;
}
