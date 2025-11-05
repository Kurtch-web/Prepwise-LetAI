import { useEffect, useState } from 'react';
import { api, FlashcardItem } from '../services/api';
import { FlashcardView } from './FlashcardView';
import { useIsOnline } from '../hooks/useOnlineStatus';
import { getFlashcardsWithOfflineSupport } from '../services/apiOffline';

const cardShellClasses =
  'rounded-3xl border border-white/10 bg-[#0b111a]/80 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.45)] backdrop-blur-xl';
const accentButtonClasses =
  'rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:border-indigo-400 hover:bg-indigo-500/20';
const quietButtonClasses =
  'rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/80 transition hover:border-rose-400 hover:bg-rose-500/20';

interface FlashcardsTabProps {
  token: string;
  isAdmin: boolean;
}

export function FlashcardsTab({ token, isAdmin }: FlashcardsTabProps) {
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('General Education');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [adminMode, setAdminMode] = useState<'upload' | 'view'>('view');
  const [selectedFlashcard, setSelectedFlashcard] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const isOnline = useIsOnline();

  const categories = ['General Education', 'Professional Education', 'Custom name'];

  const loadFlashcards = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFlashcardsWithOfflineSupport(token, api);
      setFlashcards(result.flashcards);
      setIsOffline(result.isOffline);
      setFromCache(result.fromCache);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, [token]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are allowed');
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await api.uploadFlashcard(token, selectedCategory, selectedFile);
      setSelectedFile(null);
      setSelectedCategory('General Education');
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await loadFlashcards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload flashcard');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;

    try {
      await api.deleteFlashcard(token, id);
      await loadFlashcards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flashcard');
    }
  };

  // Show flashcard view when one is selected
  if (selectedFlashcard) {
    return (
      <FlashcardView
        flashcardId={selectedFlashcard}
        token={token}
        onBack={() => setSelectedFlashcard(null)}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 mx-4 sm:mx-0">
      {/* Sidebar - Admin Only (Horizontal on mobile, vertical on desktop) */}
      {isAdmin && (
        <div className="flex md:flex-col gap-2 md:w-48 md:space-y-2">
          <button
            onClick={() => setAdminMode('view')}
            className={`flex-1 md:flex-initial text-left rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold transition ${
              adminMode === 'view'
                ? 'bg-indigo-500/20 border border-indigo-400/50 text-indigo-300'
                : 'border border-white/10 text-white/80 hover:bg-white/5'
            }`}
          >
            View
          </button>
          <button
            onClick={() => setAdminMode('upload')}
            className={`flex-1 md:flex-initial text-left rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold transition ${
              adminMode === 'upload'
                ? 'bg-indigo-500/20 border border-indigo-400/50 text-indigo-300'
                : 'border border-white/10 text-white/80 hover:bg-white/5'
            }`}
          >
            Upload
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {/* Upload Mode */}
        {isAdmin && adminMode === 'upload' && (
          <section className={`${cardShellClasses} space-y-4 sm:space-y-6`}>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Upload Flashcard</h3>
              <p className="text-xs sm:text-sm text-white/70">Upload a PDF file to parse questions and answers</p>
            </div>

            <div className="space-y-4 rounded-2xl border border-white/20 bg-white/5 p-5">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.currentTarget.value)}
                    className="w-full rounded-2xl border border-white/20 bg-[#080c14]/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2">Select PDF File</label>
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-white/70 file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2 file:font-semibold file:text-white/90 cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs text-emerald-400">
                      ✓ {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className={`${accentButtonClasses} w-full disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </section>
        )}

        {/* View Mode */}
        {(!isAdmin || adminMode === 'view') && (
          <section className={`${cardShellClasses} space-y-4 sm:space-y-6`}>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-semibold text-white">Flashcards</h3>
              <p className="text-xs sm:text-sm text-white/70">
                {isAdmin
                  ? 'Browse and study from uploaded flashcards'
                  : 'Browse and study from available learning materials'}
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white/80">
                    Available Flashcards ({flashcards.length})
                  </h4>
                  {fromCache && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
                      {isOffline ? '📴 Offline' : '💾 Cached'}
                    </span>
                  )}
                </div>
                <button
                  onClick={loadFlashcards}
                  className={`${accentButtonClasses} text-xs px-3 py-2`}
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loading ? (
                <p className="text-sm text-white/60">Loading flashcards...</p>
              ) : flashcards.length === 0 ? (
                <p className="text-sm text-white/60">No flashcards available yet.</p>
              ) : (
                <div className="grid gap-3">
                  {flashcards.map(fc => {
                    const uploadDate = new Date(fc.createdAt).toLocaleDateString();
                    return (
                      <div
                        key={fc.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 hover:bg-white/10 transition cursor-pointer"
                        onClick={() => setSelectedFlashcard(fc.id)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs sm:text-sm font-semibold text-white truncate">{fc.filename}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 whitespace-nowrap">
                                {fc.category}
                              </span>
                            </div>
                            <p className="text-xs text-white/60 mb-1">
                              {fc.uploader} • {uploadDate}
                            </p>
                            <p className="text-xs text-white/50">
                              {fc.totalQuestions} questions
                            </p>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            {fc.url && (
                              <a
                                href={fc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className={`${accentButtonClasses} text-xs px-2 sm:px-3 py-1 sm:py-2`}
                              >
                                DL
                              </a>
                            )}
                            {isAdmin && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDelete(fc.id);
                                }}
                                className={`${quietButtonClasses} text-xs px-2 sm:px-3 py-1 sm:py-2`}
                              >
                                Del
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
