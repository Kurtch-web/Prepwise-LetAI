import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { api } from '../services/api';

interface VideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function VideoUploadForm({ onSuccess, onCancel }: VideoUploadFormProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  // Form state
  const [uploadType, setUploadType] = useState<'youtube' | 'file'>('youtube');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General Education');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const categoryOptions = [
    'General Education',
    'Professional Education',
    'Science',
    'Mathematics',
    'English',
    'History',
    'Social Studies',
    'Arts',
    'Technology',
    'Health'
  ];

  const extractYoutubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        setError('File size must be less than 500MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const uploadFileToR2 = async (file: File, uploadUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
      xhr.send(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploadProgress(0);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!category.trim()) {
      setError('Category is required');
      return;
    }

    setIsLoading(true);

    try {
      if (uploadType === 'youtube') {
        // YouTube upload flow
        if (!youtubeLink.trim()) {
          setError('YouTube link is required');
          return;
        }

        const youtubeId = extractYoutubeId(youtubeLink);
        if (!youtubeId) {
          setError('Please enter a valid YouTube link (e.g., https://www.youtube.com/watch?v=...)');
          return;
        }

        const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}`;

        await api.saveVideoMetadata({
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim(),
          storage_path: 'youtube-link',
          file_url: embedUrl,
          is_downloadable: isDownloadable
        });

        // Reset form
        setTitle('');
        setDescription('');
        setCategory('General Education');
        setYoutubeLink('');
        setIsDownloadable(false);

        onSuccess?.();
      } else {
        // File upload to R2 flow
        if (!selectedFile) {
          setError('Please select a video file');
          return;
        }

        // Get presigned URL from backend
        setUploadProgress(10);
        const presignedData = await api.getPresignedUploadUrl(
          selectedFile.name,
          selectedFile.type || 'video/mp4'
        );

        setUploadProgress(20);

        // Upload file to R2 using presigned URL
        await uploadFileToR2(selectedFile, presignedData.uploadUrl);

        setUploadProgress(90);

        // Save video metadata to database
        await api.saveVideoMetadata({
          title: title.trim(),
          description: description.trim() || null,
          category: category.trim(),
          storage_path: presignedData.storagePath,
          file_url: presignedData.publicUrl,
          is_downloadable: isDownloadable
        });

        setUploadProgress(100);

        // Reset form
        setTitle('');
        setDescription('');
        setCategory('General Education');
        setSelectedFile(null);
        setIsDownloadable(false);

        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={`video-upload-form-container ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="form-title">Add Video Lesson</h3>
      </div>

      {/* Upload Type Toggle */}
      <div className="upload-type-toggle">
        <button
          type="button"
          onClick={() => {
            setUploadType('youtube');
            setSelectedFile(null);
            setYoutubeLink('');
            setError('');
          }}
          className={`toggle-btn ${uploadType === 'youtube' ? 'active' : ''}`}
        >
          🎬 YouTube Link
        </button>
        <button
          type="button"
          onClick={() => {
            setUploadType('file');
            setYoutubeLink('');
            setError('');
          }}
          className={`toggle-btn ${uploadType === 'file' ? 'active' : ''}`}
        >
          📁 Upload File
        </button>
      </div>

      <form onSubmit={handleSubmit} className="video-upload-form">
        <div className="form-group">
          <label htmlFor="title">Video Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            disabled={isLoading}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description"
            disabled={isLoading}
            rows={3}
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isLoading}
            className="form-select"
          >
            <option value="">Select a category</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {uploadType === 'youtube' ? (
          <>
            <div className="form-group">
              <label htmlFor="youtube-link">YouTube Link *</label>
              <input
                id="youtube-link"
                type="url"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="Paste YouTube link (e.g., https://www.youtube.com/watch?v=...)"
                disabled={isLoading}
                className="form-input"
              />
              <p className="link-hint">
                ℹ️ Non-cookie YouTube links will be used (youtube-nocookie.com)
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="video-file">Video File * (Max 500MB)</label>
              <input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                disabled={isLoading}
                className="form-file-input"
              />
              {selectedFile && (
                <p className="link-hint">
                  ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>
                    <span className="progress-text">{uploadProgress}%</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="form-group checkbox-group">
          <label htmlFor="downloadable">
            <input
              id="downloadable"
              type="checkbox"
              checked={isDownloadable}
              onChange={(e) => setIsDownloadable(e.target.checked)}
              disabled={isLoading}
            />
            Allow users to download this video
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? `${uploadType === 'file' ? 'Uploading...' : 'Adding...'}` : `${uploadType === 'file' ? 'Upload Video' : 'Add Video'}`}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      <style>{`
        .video-upload-form-container {
          border-radius: 12px;
          padding: 28px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .video-upload-form-container.light-mode {
          background: white;
        }

        .video-upload-form-container.dark-mode {
          background: rgb(15, 23, 42);
        }

        .form-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .light-mode .form-title {
          color: rgb(15, 23, 42);
        }

        .dark-mode .form-title {
          color: white;
        }

        .upload-type-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          padding: 4px;
          border-radius: 8px;
          width: fit-content;
        }

        .light-mode .upload-type-toggle {
          background: rgb(226, 232, 240);
        }

        .dark-mode .upload-type-toggle {
          background: rgb(30, 41, 59);
        }

        .toggle-btn {
          padding: 10px 18px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
        }

        .light-mode .toggle-btn {
          color: rgb(51, 65, 85);
        }

        .dark-mode .toggle-btn {
          color: rgb(148, 163, 184);
        }

        .toggle-btn.active {
          font-weight: 700;
        }

        .light-mode .toggle-btn.active {
          background: white;
          color: rgb(79, 70, 229);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .dark-mode .toggle-btn.active {
          background: rgb(51, 65, 85);
          color: rgb(129, 140, 248);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .video-upload-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          font-size: 14px;
        }

        .light-mode .form-group label {
          color: rgb(51, 65, 85);
        }

        .dark-mode .form-group label {
          color: rgb(226, 232, 240);
        }

        .form-input,
        .form-textarea,
        .form-select,
        .form-file-input {
          padding: 11px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s;
          border: 1.5px solid;
        }

        .light-mode .form-input,
        .light-mode .form-textarea,
        .light-mode .form-select,
        .light-mode .form-file-input {
          background: white;
          border-color: rgb(226, 232, 240);
          color: rgb(15, 23, 42);
        }

        .dark-mode .form-input,
        .dark-mode .form-textarea,
        .dark-mode .form-select,
        .dark-mode .form-file-input {
          background: rgb(30, 41, 59);
          border-color: rgb(51, 65, 85);
          color: rgb(226, 232, 240);
        }

        .form-select {
          cursor: pointer;
          appearance: none;
          padding-right: 32px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
          background-position: right 8px center;
          background-repeat: no-repeat;
          background-size: 20px;
        }

        .light-mode .form-select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23475569' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
        }

        .form-select option {
          padding: 8px;
          font-weight: 500;
        }

        .light-mode .form-select option {
          background: white;
          color: rgb(15, 23, 42);
        }

        .dark-mode .form-select option {
          background: rgb(30, 41, 59);
          color: rgb(226, 232, 240);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: rgb(148, 163, 184);
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus,
        .form-file-input:focus {
          outline: none;
          border-color: rgb(79, 70, 229);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .light-mode .form-input:disabled,
        .light-mode .form-textarea:disabled,
        .light-mode .form-select:disabled,
        .light-mode .form-file-input:disabled {
          background-color: rgb(240, 244, 248);
          color: rgb(148, 163, 184);
          cursor: not-allowed;
        }

        .dark-mode .form-input:disabled,
        .dark-mode .form-textarea:disabled,
        .dark-mode .form-select:disabled,
        .dark-mode .form-file-input:disabled {
          background-color: rgb(51, 65, 85);
          color: rgb(100, 116, 139);
          cursor: not-allowed;
        }

        .link-hint {
          margin: 6px 0 0 0;
          font-size: 12px;
          font-weight: 400;
        }

        .light-mode .link-hint {
          color: rgb(100, 116, 139);
        }

        .dark-mode .link-hint {
          color: rgb(148, 163, 184);
        }

        .checkbox-group {
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }

        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: rgb(79, 70, 229);
        }

        .checkbox-group label {
          margin: 0;
          display: flex;
          align-items: center;
          font-weight: 500;
          gap: 8px;
        }

        .progress-container {
          padding: 12px 0;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }

        .light-mode .progress-bar {
          background: rgb(226, 232, 240);
        }

        .dark-mode .progress-bar {
          background: rgb(51, 65, 85);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, rgb(79, 70, 229), rgb(129, 140, 248));
          display: flex;
          align-items: center;
          justify-content: center;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 10px;
          font-weight: 700;
          color: white;
        }

        .error-message {
          padding: 12px 14px;
          border-radius: 8px;
          border: 1.5px solid;
          font-size: 13px;
          font-weight: 500;
        }

        .light-mode .error-message {
          background-color: rgb(254, 226, 226);
          border-color: rgb(248, 180, 180);
          color: rgb(153, 27, 27);
        }

        .dark-mode .error-message {
          background-color: rgba(220, 38, 38, 0.1);
          border-color: rgb(220, 38, 38);
          color: rgb(254, 202, 202);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .btn {
          padding: 11px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
        }

        .btn-primary {
          background-color: rgb(79, 70, 229);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: rgb(67, 56, 202);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .btn-primary:disabled {
          background-color: rgb(209, 213, 219);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .light-mode .btn-secondary {
          background-color: rgb(226, 232, 240);
          color: rgb(51, 65, 85);
          border: 1.5px solid rgb(203, 213, 225);
        }

        .dark-mode .btn-secondary {
          background-color: rgb(30, 41, 59);
          color: rgb(226, 232, 240);
          border: 1.5px solid rgb(51, 65, 85);
        }

        .btn-secondary:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .light-mode .btn-secondary:hover:not(:disabled) {
          background-color: rgb(203, 213, 225);
        }

        .dark-mode .btn-secondary:hover:not(:disabled) {
          background-color: rgb(51, 65, 85);
        }

        .btn-secondary:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
