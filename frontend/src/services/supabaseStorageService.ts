import { SUPABASE_CONFIG } from '../config/supabase';

interface UploadProgress {
  loaded: number;
  total: number;
}

export const supabaseStorageService = {
  /**
   * Upload a file directly to Supabase storage
   * Bypasses backend - no Vercel payload limits!
   */
  uploadFile: async (
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total
            });
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          // Construct public URL for the uploaded file
          const publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.bucket}/${path}`;
          resolve(publicUrl);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      const uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${SUPABASE_CONFIG.bucket}/${path}`;

      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_CONFIG.anonKey}`);

      // Create FormData and append file
      const formData = new FormData();
      formData.append('file', file);

      xhr.send(formData);
    });
  },

  /**
   * Generate a storage path for a video
   */
  getVideoPath: (videoId: string, category: string, filename: string): string => {
    const date = new Date().toISOString().split('T')[0];
    // Sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `videos/${videoId}/${category}/${date}/${safeName}`;
  }
};
