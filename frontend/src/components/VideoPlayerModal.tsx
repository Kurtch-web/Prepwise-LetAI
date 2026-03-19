import { useTheme } from '../providers/ThemeProvider';

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
              <video
                className="absolute top-0 left-0 w-full h-full"
                controls
                autoPlay
              >
                <source src={video.file_url} />
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {/* Description */}
          {video.description && (
            <div className={`px-6 py-4 ${isLightMode ? 'bg-white' : 'bg-slate-900'}`}>
              <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                {video.description}
              </p>
            </div>
          )}

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
