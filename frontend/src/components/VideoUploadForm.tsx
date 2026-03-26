import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { api } from '../services/api';
import { supabaseStorageService } from '../services/supabaseStorageService';

interface VideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type TabType = 'upload' | 'link';

export default function VideoUploadForm({ onSuccess, onCancel }: VideoUploadFormProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  
  // Upload tab state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General Education');
  const [file, setFile] = useState<File | null>(null);
  const [isDownloadable, setIsDownloadable] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Link tab state
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkCategory, setLinkCategory] = useState('General Education');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [linkIsDownloadable, setLinkIsDownloadable] = useState(false);
  const [linkError, setLinkError] = useState('');

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
      const maxSizeBytes = 25 * 1024 * 1024; // 25 MB (safe limit for Vercel)

      if (!videoTypes.includes(selectedFile.type)) {
        setError('Please select a valid video file (MP4, WebM, MOV, AVI, MKV)');
        setFile(null);
      } else if (selectedFile.size > maxSizeBytes) {
        setError('Video file size must not exceed 50 MB');
        setFile(null);
      } else {
        setFile(selectedFile);
        setError('');
      }
    }
  };

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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!category.trim()) {
      setError('Category is required');
      return;
    }

    if (!file) {
      setError('Please select a video file');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Upload file directly to Supabase (bypasses Vercel!)
      const videoId = crypto.randomUUID();
      const storagePath = supabaseStorageService.getVideoPath(videoId, category.trim(), file.name);

      const fileUrl = await supabaseStorageService.uploadFile(file, storagePath, (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        console.log(`Upload progress: ${percent}%`);
      });

      // Step 2: Save metadata to backend
      await api.saveVideoMetadata({
        title: title.trim(),
        description: description.trim() || null,
        category: category.trim(),
        storage_path: storagePath,
        file_url: fileUrl,
        is_downloadable: isDownloadable
      });

      setTitle('');
      setDescription('');
      setCategory('General Education');
      setFile(null);
      setIsDownloadable(true);

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');

    if (!linkTitle.trim()) {
      setLinkError('Title is required');
      return;
    }

    if (!linkCategory.trim()) {
      setLinkError('Category is required');
      return;
    }

    if (!youtubeLink.trim()) {
      setLinkError('YouTube link is required');
      return;
    }

    const youtubeId = extractYoutubeId(youtubeLink);
    if (!youtubeId) {
      setLinkError('Please enter a valid YouTube link (e.g., https://www.youtube.com/watch?v=...)');
      return;
    }

    setIsLoading(true);

    try {
      const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}`;
      const videoId = crypto.randomUUID();

      await api.saveVideoMetadata({
        title: linkTitle,
        description: linkDescription || null,
        category: linkCategory,
        storage_path: 'youtube-link',
        file_url: embedUrl,
        is_downloadable: linkIsDownloadable
      });

      setLinkTitle('');
      setLinkDescription('');
      setLinkCategory('General Education');
      setYoutubeLink('');
      setLinkIsDownloadable(false);

      onSuccess?.();
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Failed to add video link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`video-upload-form-container ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
      <h3 className="form-title">Add Video Lesson</h3>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
          disabled={isLoading}
        >
          📤 Upload File
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'link' ? 'active' : ''}`}
          onClick={() => setActiveTab('link')}
          disabled={isLoading}
        >
          🔗 YouTube Link
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="video-upload-form">
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

          <div className="form-group">
            <label htmlFor="file">Video File *</label>
            <input
              id="file"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="form-input file-input"
            />
            {file && (
              <p className="file-selected">
                📹 {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

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
              {isLoading ? 'Uploading...' : 'Upload Video'}
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
      )}

      {/* Link Tab */}
      {activeTab === 'link' && (
        <form onSubmit={handleLinkSubmit} className="video-upload-form">
          <div className="form-group">
            <label htmlFor="link-title">Video Title *</label>
            <input
              id="link-title"
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Enter video title"
              disabled={isLoading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="link-description">Description</label>
            <textarea
              id="link-description"
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              placeholder="Enter video description"
              disabled={isLoading}
              rows={3}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="link-category">Category *</label>
            <select
              id="link-category"
              value={linkCategory}
              onChange={(e) => setLinkCategory(e.target.value)}
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

          <div className="form-group checkbox-group">
            <label htmlFor="link-downloadable">
              <input
                id="link-downloadable"
                type="checkbox"
                checked={linkIsDownloadable}
                onChange={(e) => setLinkIsDownloadable(e.target.checked)}
                disabled={isLoading}
              />
              Allow users to download this video
            </label>
          </div>

          {linkError && <div className="error-message">{linkError}</div>}

          <div className="form-actions">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Adding...' : 'Add Video'}
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
      )}

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
          margin: 0 0 24px 0;
          font-size: 18px;
          font-weight: 700;
        }

        .light-mode .form-title {
          color: rgb(15, 23, 42);
        }

        .dark-mode .form-title {
          color: white;
        }

        /* Tab Navigation */
        .tab-navigation {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid;
          padding-bottom: 0;
        }

        .light-mode .tab-navigation {
          border-bottom-color: rgb(226, 232, 240);
        }

        .dark-mode .tab-navigation {
          border-bottom-color: rgb(51, 65, 85);
        }

        .tab-btn {
          padding: 12px 18px;
          background: transparent;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          white-space: nowrap;
        }

        .light-mode .tab-btn {
          color: rgb(100, 116, 139);
        }

        .dark-mode .tab-btn {
          color: rgb(148, 163, 184);
        }

        .tab-btn:hover:not(:disabled) {
          color: rgb(79, 70, 229);
        }

        .light-mode .tab-btn.active {
          color: rgb(79, 70, 229);
          border-bottom-color: rgb(79, 70, 229);
        }

        .dark-mode .tab-btn.active {
          color: rgb(147, 197, 253);
          border-bottom-color: rgb(147, 197, 253);
        }

        .tab-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
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
        .form-select {
          padding: 11px 14px;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s;
          border: 1.5px solid;
        }

        .light-mode .form-input,
        .light-mode .form-textarea,
        .light-mode .form-select {
          background: white;
          border-color: rgb(226, 232, 240);
          color: rgb(15, 23, 42);
        }

        .dark-mode .form-input,
        .dark-mode .form-textarea,
        .dark-mode .form-select {
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
        .form-select:focus {
          outline: none;
          border-color: rgb(79, 70, 229);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .light-mode .form-input:disabled,
        .light-mode .form-textarea:disabled,
        .light-mode .form-select:disabled {
          background-color: rgb(240, 244, 248);
          color: rgb(148, 163, 184);
          cursor: not-allowed;
        }

        .dark-mode .form-input:disabled,
        .dark-mode .form-textarea:disabled,
        .dark-mode .form-select:disabled {
          background-color: rgb(51, 65, 85);
          color: rgb(100, 116, 139);
          cursor: not-allowed;
        }

        .file-input {
          cursor: pointer;
        }

        .file-selected {
          margin: 8px 0 0 0;
          font-size: 13px;
          padding: 10px;
          border-radius: 6px;
          font-weight: 500;
        }

        .light-mode .file-selected {
          background-color: rgb(240, 249, 255);
          color: rgb(7, 89, 133);
        }

        .dark-mode .file-selected {
          background-color: rgba(79, 70, 229, 0.1);
          color: rgb(147, 197, 253);
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
