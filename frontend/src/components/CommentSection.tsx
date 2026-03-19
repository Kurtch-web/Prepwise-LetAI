import { useEffect, useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { postsService, PostComment } from '../services/postsService';
import { formatTimeShort, formatFullDate } from '../utils/dateFormatter';

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function CommentSection({ postId, isOpen, onToggle }: CommentSectionProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLightMode = theme === 'light';
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen]);

  const loadComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await postsService.fetchComments(postId);
      setComments(result.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const comment = await postsService.createComment(postId, newComment);
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await postsService.deleteComment(postId, commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  return (
    <div className={`rounded-lg border-t ${
      isLightMode ? 'border-slate-200' : 'border-emerald-500/20'
    }`}>
      {error && (
        <div className={`rounded-lg border p-3 text-sm m-4 ${
          isLightMode
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-red-500/30 bg-red-900/20 text-red-300'
        }`}>
          ❌ {error}
        </div>
      )}

      {isOpen && (
        <div className="p-4 space-y-4">
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={500}
              rows={2}
              className={`w-full rounded-lg border p-3 resize-none focus:outline-none ${
                isLightMode
                  ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-emerald-600'
                  : 'border-emerald-500/30 bg-emerald-950/40 text-white placeholder-white/50 focus:border-emerald-400'
              }`}
            />
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                {newComment.length}/500
              </span>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  isLightMode
                    ? 'border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'border border-emerald-400 bg-emerald-600/80 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {submitting ? '💬 Posting...' : '💬 Comment'}
              </button>
            </div>
          </form>

          {loading ? (
            <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-lg p-3 ${
                    isLightMode
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-emerald-900/10 border border-emerald-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className={`font-semibold text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {comment.username}
                      </p>
                      <p
                        className={`text-xs cursor-help ${isLightMode ? 'text-slate-600 hover:text-slate-700' : 'text-white/60 hover:text-white/80'}`}
                        title={formatFullDate(comment.created_at)}
                      >
                        {formatTimeShort(comment.created_at)}
                      </p>
                    </div>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className={`text-xs px-2 py-1 rounded transition ${
                          isLightMode
                            ? 'text-red-700 hover:bg-red-100'
                            : 'text-red-300 hover:bg-red-900/30'
                        }`}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p className={`text-sm ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
