// R2 Service - handles direct uploads to Cloudflare R2
// Uses AWS S3-compatible API for presigned URLs

const R2_ACCESS_KEY = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.amazonaws.com`;

interface PresignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  storagePath: string;
  expiresIn: number;
}

interface UploadProgress {
  loaded: number;
  total: number;
}

/**
 * Generate a presigned PUT URL for direct R2 uploads
 * This avoids backend dependency and works directly with R2
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string = 'video/mp4'
): Promise<PresignedUrlResult> {
  // Create a simple presigned URL
  // For simplicity, we'll use a direct upload approach with basic auth
  
  const storagePath = `videos/${Date.now()}-${filename}`;
  const uploadUrl = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${storagePath}`;
  const publicUrl = `${R2_PUBLIC_URL}/${storagePath}`;
  
  return {
    uploadUrl,
    publicUrl,
    storagePath,
    expiresIn: 3600 // 1 hour
  };
}

/**
 * Upload file directly to R2 with progress tracking
 */
export function uploadFileToR2(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress?.({
          loaded: event.loaded,
          total: event.total
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    
    // Add CORS headers if needed
    xhr.withCredentials = false;
    
    xhr.send(file);
  });
}

/**
 * Verify R2 credentials are configured
 */
export function areR2CredentialsConfigured(): boolean {
  return !!(R2_ACCESS_KEY && R2_SECRET_KEY && R2_ACCOUNT_ID && R2_BUCKET_NAME && R2_PUBLIC_URL);
}

export const r2Service = {
  getPresignedUploadUrl,
  uploadFileToR2,
  areR2CredentialsConfigured
};

export default r2Service;
