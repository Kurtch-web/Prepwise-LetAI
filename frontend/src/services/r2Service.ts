// R2 Service - handles uploads to Cloudflare R2
// Backend generates presigned URLs with proper AWS S3 signatures

interface UploadProgress {
  loaded: number;
  total: number;
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

export const r2Service = {
  uploadFileToR2
};

export default r2Service;
