// R2 Service - handles uploads to Cloudflare R2
// Backend generates presigned URLs with proper AWS S3 signatures

interface UploadProgress {
  loaded: number;
  total: number;
}

/**
 * Upload file directly to R2 with progress tracking
 */
export async function uploadFileToR2(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'video/mp4'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${text}`);
  }
}

export const r2Service = {
  uploadFileToR2
};

export default r2Service;
