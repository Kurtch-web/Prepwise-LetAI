import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { API_BASE } from '../config/backends';
import { authService } from '../services/authService';

interface Video {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_url: string;
  is_downloadable: boolean;
  created_at: string;
  uploader?: { id: number; username: string };
}

interface VideoEditModalProps {
  isOpen: boolean;
  video: Video | null;
  categories: string[];
  onClose: () => void;
  onSuccess: (updatedVideo: Video) => void;
}

export function VideoEditModal({ isOpen, video, categories, onClose, onSuccess }: VideoEditModalProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isDownloadable, setIsDownloadable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setDescription(video.description || '');
      setCategory(video.category);
      setIsDownloadable(video.is_downloadable);
      setError('');
    }
  }, [video, isOpen]);

  if (!isOpen || !video) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!category.trim()) {
        throw new Error('Category is required');
      }

      const headers = new Headers();
      const token = authService.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category.trim());
      formData.append('is_downloadable', String(isDownloadable));

      const response = await fetch(`${API_BASE}/api/videos/${video.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update video');
      }

      const updatedVideo = await response.json();
      onSuccess(updatedVideo);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update video');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${
      isLightMode ? 'bg-black/30' : 'bg-black/60'
    }`}>
      <div className={`rounded-3xl border w-full max-w-md mx-4 overflow-hidden ${
        isLightMode
          ? 'border-emerald-200 bg-white'
          : 'border-emerald-500/20 bg-slate-900'
      }`}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                ✏️ Edit Video
              </h1>
              <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-600' : 'text-white/70'}`}>
                Update the video details
              </p>
            </div>
            <button
              onClick={onClose}
              className={`flex-shrink-0 text-2xl transition ${
                isLightMode
                  ? 'text-slate-400 hover:text-slate-600'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              ✕
            </button>
          </div>

          {error && (
            <div className={`rounded-lg border p-3 ${
              isLightMode
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-red-900/20 border-red-500/30 text-red-300'
            }`}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Field */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                    : 'bg-slate-800 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-800'
                } focus:outline-none`}
              />
            </div>

            {/* Category Field */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                    : 'bg-slate-800 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-800'
                } focus:outline-none`}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Field */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description (optional)"
                rows={3}
                className={`w-full px-4 py-2 rounded-lg border transition ${
                  isLightMode
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                    : 'bg-slate-800 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-800'
                } focus:outline-none`}
              />
            </div>

            {/* Downloadable Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is-downloadable"
                checked={isDownloadable}
                onChange={(e) => setIsDownloadable(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="is-downloadable" className={`text-sm font-medium cursor-pointer ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                Allow students to download this video
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isLoading ? '⏳ Saving...' : '✓ Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
