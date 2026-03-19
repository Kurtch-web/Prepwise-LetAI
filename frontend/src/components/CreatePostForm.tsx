import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { postsService } from '../services/postsService';

interface CreatePostFormProps {
  onPostCreated: () => void;
  isLoading?: boolean;
}

export function CreatePostForm({ onPostCreated, isLoading = false }: CreatePostFormProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.currentTarget.files || []);
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await postsService.createPost(content, files);
      setContent('');
      setFiles([]);
      onPostCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`rounded-3xl border p-6 sm:p-8 ${
      isLightMode
        ? 'bg-white border-emerald-200'
        : 'bg-[#064e3b]/80 border-emerald-500/20'
    }`}>
      <h3 className={`text-lg sm:text-xl font-bold mb-4 ${
        isLightMode ? 'text-slate-900' : 'text-white'
      }`}>✍️ Create a Post</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community..."
            maxLength={2000}
            rows={4}
            className={`w-full rounded-xl border p-4 resize-none focus:outline-none ${
              isLightMode
                ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-emerald-600'
                : 'border-emerald-500/30 bg-emerald-950/50 text-white placeholder-white/50 focus:border-emerald-400'
            }`}
          />
          <p className={`text-xs mt-2 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
            {content.length}/2000 characters
          </p>
        </div>

        {error && (
          <div className={`rounded-lg border p-3 text-sm ${
            isLightMode
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-red-500/30 bg-red-900/20 text-red-300'
          }`}>
            ❌ {error}
          </div>
        )}

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            isLightMode ? 'text-slate-700' : 'text-emerald-300'
          }`}>
            Attachments (Images, Videos, GIFs, PDFs)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf,.gif"
            className={`block w-full text-sm ${
              isLightMode
                ? 'text-slate-600 file:rounded-lg file:border file:border-emerald-300 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700'
                : 'text-white/70 file:rounded-lg file:border file:border-emerald-400/60 file:bg-emerald-600/30 file:px-3 file:py-2 file:font-semibold file:text-emerald-300'
            } cursor-pointer`}
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className={`text-sm font-medium ${isLightMode ? 'text-slate-700' : 'text-emerald-300'}`}>
              📎 {files.length} file(s) selected
            </p>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    isLightMode
                      ? 'bg-slate-100 border border-slate-300'
                      : 'bg-emerald-900/20 border border-emerald-500/30'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {file.name}
                    </p>
                    <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className={`ml-3 rounded-lg px-3 py-2 font-semibold transition ${
                      isLightMode
                        ? 'text-red-700 hover:bg-red-100'
                        : 'text-red-300 hover:bg-red-900/30'
                    }`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || isLoading || !content.trim()}
          className={`w-full rounded-xl px-6 py-3 font-semibold transition ${
            isLightMode
              ? 'border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
              : 'border border-emerald-400 bg-emerald-600/80 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {uploading ? '📤 Posting...' : '🚀 Post Now'}
        </button>
      </form>
    </div>
  );
}
