import { useState } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { postsService, Post } from '../services/postsService';
import { CommentSection } from './CommentSection';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { formatRelativeTime, formatFullDate } from '../utils/dateFormatter';

interface PostCardProps {
  post: Post;
  onPostUpdated: (updatedPost: Post) => void;
  onPostDeleted: (postId: string) => void;
}

export function PostCard({ post, onPostUpdated, onPostDeleted }: PostCardProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLightMode = theme === 'light';
  const [liked, setLiked] = useState(post.user_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLike = async () => {
    try {
      if (liked) {
        await postsService.unlikePost(post.id);
        setLiked(false);
        setLikeCount(likeCount - 1);
      } else {
        await postsService.likePost(post.id);
        setLiked(true);
        setLikeCount(likeCount + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like');
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await postsService.deletePost(post.id);
      setShowDeleteModal(false);
      onPostDeleted(post.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition hover:shadow-lg ${
      isLightMode
        ? 'bg-white border-slate-200'
        : 'bg-slate-800/40 border-slate-700'
    }`}>
      {/* Header */}
      <div className={`flex items-start justify-between p-5 border-b ${
        isLightMode ? 'border-slate-200' : 'border-slate-700'
      }`}>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            {post.author_username}
          </p>
          <p
            className={`text-sm cursor-help ${isLightMode ? 'text-slate-600 hover:text-slate-700' : 'text-white/60 hover:text-white/80'}`}
            title={formatFullDate(post.created_at)}
          >
            {formatRelativeTime(post.created_at)} ago
          </p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={loading}
            className={`text-sm px-3 py-2 rounded-lg transition ${
              isLightMode
                ? 'text-red-700 hover:bg-red-100 disabled:opacity-50'
                : 'text-red-300 hover:bg-red-900/30 disabled:opacity-50'
            }`}
          >
            🗑️
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <p className={`text-base leading-relaxed ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          {post.content}
        </p>

        {/* Attachments Grid */}
        {post.attachments.length > 0 && (
          <div className={`grid gap-3 rounded-lg p-4 ${
            isLightMode ? 'bg-slate-50' : 'bg-slate-900/30'
          }`}>
            {post.attachments.map((attachment) => (
              <div key={attachment.id} className="space-y-2">
                {attachment.file_type === 'image' ? (
                  <img
                    src={attachment.file_url}
                    alt={attachment.original_filename}
                    className="rounded-lg max-h-96 w-full object-cover"
                  />
                ) : attachment.file_type === 'video' ? (
                  <video
                    src={attachment.file_url}
                    controls
                    className="rounded-lg max-h-96 w-full"
                  />
                ) : (
                  <a
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 rounded-lg p-3 transition ${
                      isLightMode
                        ? 'bg-white border border-slate-300 hover:bg-slate-100'
                        : 'bg-slate-800 border border-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-2xl">
                      {attachment.file_type === 'pdf' ? '📄' : '📎'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm truncate ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {attachment.original_filename}
                      </p>
                      <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                        Click to download
                      </p>
                    </div>
                    <span className="text-xl">↓</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className={`rounded-lg border p-3 text-sm ${
            isLightMode
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-red-500/30 bg-red-900/20 text-red-300'
          }`}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-4 p-5 border-t ${
        isLightMode ? 'border-slate-200' : 'border-slate-700'
      }`}>
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
            liked
              ? isLightMode
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
              : isLightMode
              ? 'text-slate-700 hover:bg-slate-100'
              : 'text-white/70 hover:bg-slate-800'
          }`}
        >
          <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
          <span className="text-sm">{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'text-slate-700 hover:bg-slate-100'
              : 'text-white/70 hover:bg-slate-800'
          }`}
        >
          <span className="text-lg">💬</span>
          <span className="text-sm">{commentCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      <CommentSection
        postId={post.id}
        isOpen={showComments}
        onToggle={() => setShowComments(!showComments)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Post"
        message="Are you sure you want to delete this post? All comments and likes will also be deleted."
        itemName={`"${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}"`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        isLoading={loading}
        danger={true}
      />
    </div>
  );
}
