import { useEffect, useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { VideoPlayerModal } from './VideoPlayerModal';

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

interface VideoListProps {
  onEditVideo?: (video: Video) => void;
}

export default function VideoList({ onEditVideo }: VideoListProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  useEffect(() => {
    fetchVideos();
    fetchCategories();
  }, [selectedCategory]);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const url = selectedCategory
        ? `/api/videos?category=${encodeURIComponent(selectedCategory)}`
        : '/api/videos';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch videos');
      const data = await response.json();
      setVideos(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/videos/categories/list');
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', contentType, text.substring(0, 200));
        throw new Error(`Invalid response type: ${contentType}`);
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleDelete = async (videoId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeletingId(videoId);
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      setVideos(videos.filter((v) => v.id !== videoId));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete video');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className={`rounded-3xl border p-7 ${
        isLightMode
          ? 'bg-white border-emerald-200'
          : 'bg-slate-900/40 border-emerald-500/20'
      }`}>
        <p className={`text-center font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
          ⏳ Loading videos...
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border p-7 transition-all ${
      isLightMode
        ? 'bg-white border-emerald-200 shadow-lg'
        : 'bg-slate-900/40 border-emerald-500/20 shadow-[0_18px_40px_rgba(6,78,59,0.45)]'
    }`}>
      <div className="mb-6">
        <h3 className={`text-2xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          📹 Video Lessons
        </h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              selectedCategory === null
                ? isLightMode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 text-white'
                : isLightMode
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                selectedCategory === cat
                  ? isLightMode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : isLightMode
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={`rounded-lg border p-4 mb-6 ${
          isLightMode
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-red-900/20 border-red-500/30 text-red-300'
        }`}>
          {error}
        </div>
      )}

      {videos.length === 0 ? (
        <div className={`rounded-2xl border-2 border-dashed p-12 text-center ${
          isLightMode
            ? 'border-slate-300 bg-slate-50'
            : 'border-slate-600 bg-slate-800/20'
        }`}>
          <p className={`text-lg font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            📹 No videos found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className={`rounded-2xl border p-5 transition-all ${
                isLightMode
                  ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 hover:shadow-lg'
                  : 'border-emerald-500/20 bg-emerald-900/10 hover:border-emerald-500/40 hover:shadow-lg'
              }`}
            >
              <div className="mb-3">
                <h4 className={`font-semibold text-lg mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {video.title}
                </h4>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  isLightMode
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-emerald-500/30 text-emerald-200'
                }`}>
                  {video.category}
                </span>
              </div>

              {video.description && (
                <p className={`text-sm mb-3 line-clamp-2 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {video.description}
                </p>
              )}

              <div className={`text-xs space-y-1 py-3 border-y ${
                isLightMode ? 'border-emerald-200 text-slate-600' : 'border-emerald-500/20 text-slate-400'
              }`}>
                <div>📅 {formatDate(video.created_at)}</div>
                {video.uploader && <div>👤 {video.uploader.username}</div>}
                {video.is_downloadable && <div>⬇️ Downloadable</div>}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedVideo(video);
                    setIsPlayerOpen(true);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm text-center transition ${
                    isLightMode
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  ▶️ Play
                </button>
                <button
                  onClick={() => onEditVideo?.(video)}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition border ${
                    isLightMode
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-600 text-slate-300 hover:bg-slate-700/30'
                  }`}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(video.id, video.title)}
                  disabled={deletingId === video.id}
                  className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition border ${
                    deletingId === video.id
                      ? isLightMode
                        ? 'border-slate-300 text-slate-500 cursor-not-allowed opacity-50'
                        : 'border-slate-600 text-slate-500 cursor-not-allowed opacity-50'
                      : isLightMode
                      ? 'border-red-300 text-red-700 hover:bg-red-50'
                      : 'border-red-500/30 text-red-400 hover:bg-red-900/20'
                  }`}
                >
                  {deletingId === video.id ? '⏳...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={isPlayerOpen}
        video={selectedVideo}
        onClose={() => {
          setIsPlayerOpen(false);
          setSelectedVideo(null);
        }}
      />
    </div>
  );
}
