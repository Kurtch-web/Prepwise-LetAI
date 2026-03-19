import { useEffect, useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';

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

export default function VideoLessonsPage() {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

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
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleDownload = async (video: Video) => {
    if (!video.is_downloadable) {
      alert('This video is not available for download');
      return;
    }

    try {
      const response = await fetch(`/api/videos/${video.id}/download`);
      if (!response.ok) throw new Error('Failed to get download link');
      const data = await response.json();

      const a = document.createElement('a');
      a.href = data.download_url;
      a.download = data.filename || video.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download video');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="video-lessons-page">
      <div className="page-header">
        <h1 className="page-title">📹 Video Lessons</h1>
        <p className="page-subtitle">Learn from our collection of video lessons</p>
      </div>

      <div className="page-content">
        <div className={`video-grid-section ${selectedVideo ? 'with-player' : ''}`}>
          <div className="category-filter">
            <button
              className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          {isLoading ? (
            <div className="loading-state">
              <p>Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">No videos available in this category</p>
            </div>
          ) : (
            <div className="videos-grid">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`video-grid-item ${selectedVideo?.id === video.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="video-thumbnail">
                    <div className="play-button">▶️</div>
                  </div>
                  <div className="video-grid-info">
                    <h3 className="video-grid-title">{video.title}</h3>
                    <p className="video-grid-category">{video.category}</p>
                    <p className="video-grid-date">{formatDate(video.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedVideo && (
          <div className="video-player-section">
            <div className="video-player">
              {selectedVideo.file_url.includes('youtube-nocookie.com') ? (
                <iframe
                  className="player-element"
                  src={selectedVideo.file_url}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={selectedVideo.file_url}
                  controls
                  className="player-element"
                />
              )}
            </div>

            <div className="video-details">
              <h2 className="details-title">{selectedVideo.title}</h2>
              <p className="details-category">📚 {selectedVideo.category}</p>

              {selectedVideo.description && (
                <div className="details-description">
                  <h3 className="description-title">Description</h3>
                  <p className="description-text">{selectedVideo.description}</p>
                </div>
              )}

              <div className="details-metadata">
                <span className="metadata-item">
                  📅 {formatDate(selectedVideo.created_at)}
                </span>
                {selectedVideo.uploader && (
                  <span className="metadata-item">
                    👤 {selectedVideo.uploader.username}
                  </span>
                )}
              </div>

              {selectedVideo.is_downloadable && (
                <button
                  onClick={() => handleDownload(selectedVideo)}
                  className="btn-download"
                >
                  ⬇️ Download Video
                </button>
              )}

              <button onClick={() => setSelectedVideo(null)} className="btn-close">
                ✕ Close
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .video-lessons-page {
          min-height: 100vh;
          background: ${isLightMode
            ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'};
          padding: 40px 20px;
        }

        .page-header {
          text-align: center;
          color: ${isLightMode ? '#333' : 'white'};
          margin-bottom: 40px;
        }

        .page-title {
          font-size: 36px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .page-subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin: 0;
        }

        .page-content {
          display: flex;
          gap: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .video-grid-section {
          flex: 1;
          min-width: 0;
        }

        .video-grid-section.with-player {
          flex: 0 0 40%;
        }

        .category-filter {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .category-btn {
          padding: 8px 16px;
          border: 2px solid ${isLightMode ? '#333' : 'white'};
          border-radius: 20px;
          background-color: transparent;
          color: ${isLightMode ? '#333' : 'white'};
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .category-btn:hover {
          background-color: ${isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
        }

        .category-btn.active {
          background-color: ${isLightMode ? '#333' : 'white'};
          color: ${isLightMode ? 'white' : '#667eea'};
        }

        .error-message {
          padding: 16px;
          background-color: ${isLightMode ? '#fee' : 'rgba(220, 38, 38, 0.1)'};
          border: 1px solid ${isLightMode ? '#fcc' : '#dc2626'};
          border-radius: 6px;
          color: ${isLightMode ? '#c33' : '#fecaca'};
          font-size: 14px;
          margin-bottom: 16px;
        }

        .loading-state {
          text-align: center;
          padding: 40px 20px;
          background-color: ${isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)'};
          border-radius: 8px;
          color: ${isLightMode ? '#666' : 'white'};
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background-color: ${isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)'};
          border-radius: 8px;
          color: ${isLightMode ? '#666' : 'white'};
        }

        .empty-text {
          font-size: 16px;
          margin: 0;
        }

        .videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .video-grid-item {
          background-color: ${isLightMode ? 'white' : '#1e293b'};
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: ${isLightMode ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.3)'};
          border: 1px solid ${isLightMode ? '#e5e7eb' : '#334155'};
        }

        .video-grid-item:hover {
          transform: translateY(-4px);
          box-shadow: ${isLightMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.4)'};
        }

        .video-grid-item.selected {
          border: 3px solid ${isLightMode ? '#667eea' : '#4f46e5'};
          box-shadow: ${isLightMode ? '0 4px 16px rgba(102, 126, 234, 0.2)' : '0 4px 16px rgba(79, 70, 229, 0.3)'};
        }

        .video-thumbnail {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%;
          background: ${isLightMode
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'};
        }

        .play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 32px;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .video-grid-item:hover .play-button {
          opacity: 1;
        }

        .video-grid-info {
          padding: 12px;
        }

        .video-grid-title {
          margin: 0 0 4px 0;
          font-size: 13px;
          font-weight: 600;
          color: ${isLightMode ? '#333' : '#e2e8f0'};
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .video-grid-category {
          margin: 4px 0;
          font-size: 12px;
          color: ${isLightMode ? '#666' : '#cbd5e1'};
        }

        .video-grid-date {
          margin: 4px 0 0 0;
          font-size: 11px;
          color: ${isLightMode ? '#999' : '#94a3b8'};
        }

        .video-player-section {
          flex: 0 0 60%;
          background-color: ${isLightMode ? 'white' : '#1e293b'};
          border-radius: 8px;
          overflow: hidden;
          box-shadow: ${isLightMode ? '0 8px 32px rgba(0, 0, 0, 0.1)' : '0 8px 32px rgba(0, 0, 0, 0.4)'};
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 20px;
          border: 1px solid ${isLightMode ? '#e5e7eb' : '#334155'};
        }

        .video-player {
          width: 100%;
          padding-bottom: 56.25%;
          position: relative;
          background-color: #000;
        }

        .player-element {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .video-details {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
          background-color: ${isLightMode ? 'white' : '#1e293b'};
        }

        .details-title {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 700;
          color: ${isLightMode ? '#333' : '#e2e8f0'};
        }

        .details-category {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: ${isLightMode ? '#666' : '#cbd5e1'};
          font-weight: 500;
        }

        .details-description {
          margin: 16px 0;
          padding: 16px;
          background-color: ${isLightMode ? '#f5f5f5' : '#0f172a'};
          border-radius: 6px;
          border: 1px solid ${isLightMode ? '#e5e7eb' : '#334155'};
        }

        .description-title {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 600;
          color: ${isLightMode ? '#333' : '#e2e8f0'};
        }

        .description-text {
          margin: 0;
          font-size: 13px;
          color: ${isLightMode ? '#666' : '#cbd5e1'};
          line-height: 1.5;
        }

        .details-metadata {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin: 16px 0;
          padding: 12px 0;
          border-top: 1px solid ${isLightMode ? '#eee' : '#334155'};
          border-bottom: 1px solid ${isLightMode ? '#eee' : '#334155'};
          font-size: 12px;
          color: ${isLightMode ? '#666' : '#cbd5e1'};
        }

        .metadata-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .btn-download {
          width: 100%;
          padding: 12px;
          margin-top: 16px;
          background-color: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-download:hover {
          background-color: #047857;
        }

        .btn-close {
          width: 100%;
          padding: 8px;
          margin-top: 8px;
          background-color: ${isLightMode ? '#f0f0f0' : '#334155'};
          color: ${isLightMode ? '#333' : '#e2e8f0'};
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-close:hover {
          background-color: ${isLightMode ? '#e0e0e0' : '#475569'};
        }

        @media (max-width: 1024px) {
          .page-content {
            flex-direction: column;
          }

          .video-grid-section.with-player {
            flex: 1;
          }

          .video-player-section {
            position: static;
          }

          .videos-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 24px;
          }

          .videos-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .video-details {
            padding: 16px;
          }

          .details-title {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .videos-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .video-grid-info {
            padding: 8px;
          }

          .video-grid-title {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
