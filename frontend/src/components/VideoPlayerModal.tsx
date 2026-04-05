import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { API_BASE } from '../config/backends';

interface VideoPlayerModalProps {
  isOpen: boolean;
  video: {
    id: string;
    title: string;
    description?: string;
    file_url: string;
  } | null;
  onClose: () => void;
}

export function VideoPlayerModal({ isOpen, video, onClose }: VideoPlayerModalProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  if (!isOpen || !video) return null;

  const isYouTube = video.file_url.includes('youtube-nocookie.com');

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      >
        <div
          className={`w-full max-w-4xl rounded-2xl overflow-hidden transition-transform ${
            isOpen ? 'scale-100' : 'scale-95'
          } ${isLightMode ? 'bg-white' : 'bg-slate-900'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 border-b flex items-center justify-between ${
              isLightMode
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <h2 className={`text-xl font-bold truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {video.title}
            </h2>
            <button
              onClick={onClose}
              className={`text-2xl leading-none transition hover:scale-110 ${
                isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Video Player */}
          <div className="relative bg-black w-full" style={{ paddingBottom: '56.25%' }}>
            {isYouTube ? (
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={video.file_url}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <video
                  className="absolute top-0 left-0 w-full h-full"
                  controls
                  autoPlay
                  onLoadStart={() => setIsLoading(true)}
                  onCanPlay={() => setIsLoading(false)}
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => setIsBuffering(false)}
                >
                  <source src={`${API_BASE}/api/videos/${video.id}/stream`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Loading Spinner */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
                      <p className="text-white text-sm font-medium">Loading video...</p>
                    </div>
                  </div>
                )}

                {/* Buffering Indicator */}
                {isBuffering && !isLoading && (
                  <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-2 rounded-lg text-xs font-medium">
                    ⏳ Buffering...
                  </div>
                )}
              </>
            )}
          </div>

          {/* Description & Info */}
          <div className={`px-6 py-4 ${isLightMode ? 'bg-white' : 'bg-slate-900'}`}>
            {video.description && (
              <p className={`text-sm leading-relaxed mb-3 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                {video.description}
              </p>
            )}

            {/* Video Loading Tip */}
            <div className={`p-3 rounded-lg text-xs ${
              isLightMode
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-blue-900/20 border border-blue-500/20'
            }`}>
              <p className={isLightMode ? 'text-blue-700' : 'text-blue-300'}>
                💡 <span className="font-semibold">Tip:</span> If video is slow to load, try refreshing or waiting a moment. Larger videos buffer in the background while you watch.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t ${
            isLightMode
              ? 'border-slate-200 bg-slate-50'
              : 'border-slate-700 bg-slate-800/30'
          }`}>
            <button
              onClick={onClose}
              className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
