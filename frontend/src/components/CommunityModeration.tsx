import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { Post, postsService } from '../services/postsService';
import { formatRelativeTime } from '../utils/dateFormatter';

interface ModerationPost extends Post {}

export function CommunityModeration() {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'flagged' | 'appeals'>('all');
  const [selectedPost, setSelectedPost] = useState<ModerationPost | null>(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flaggingPostId, setFlaggingPostId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await postsService.fetchAllPostsForModeration(0, 100);
      setPosts(result.posts as ModerationPost[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagPost = async (postId: string) => {
    if (!flagReason.trim()) {
      setError('Please provide a reason for flagging');
      return;
    }

    setActionLoading(true);
    try {
      await postsService.flagPost(postId, flagReason);
      setFlagReason('');
      setShowFlagModal(false);
      setFlaggingPostId(null);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flag post');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnflagPost = async (postId: string) => {
    setActionLoading(true);
    try {
      await postsService.unflagPost(postId);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unflag post');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDenyAppeal = async (postId: string) => {
    if (!confirm('Are you sure? This will delete the post permanently.')) {
      return;
    }

    setActionLoading(true);
    try {
      await postsService.denyAppeal(postId);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny appeal');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filterBy === 'flagged') return post.is_flagged;
    if (filterBy === 'appeals') return post.has_appeal;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            🛡️ Community Moderation
          </h3>
          <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
            Review and moderate community posts
          </p>
        </div>
        <button
          onClick={loadPosts}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
            isLightMode
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50'
              : 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50'
          }`}
        >
          {loading ? '⟳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterBy('all')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
            filterBy === 'all'
              ? isLightMode
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-600 text-white'
              : isLightMode
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          📋 All Posts ({posts.length})
        </button>
        <button
          onClick={() => setFilterBy('flagged')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
            filterBy === 'flagged'
              ? isLightMode
                ? 'bg-red-600 text-white'
                : 'bg-red-600 text-white'
              : isLightMode
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          🚩 Flagged ({posts.filter(p => p.is_flagged).length})
        </button>
        <button
          onClick={() => setFilterBy('appeals')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
            filterBy === 'appeals'
              ? isLightMode
                ? 'bg-amber-600 text-white'
                : 'bg-amber-600 text-white'
              : isLightMode
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          📢 Appeals ({posts.filter(p => p.has_appeal).length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`rounded-lg border p-4 ${
          isLightMode
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-red-500/30 bg-red-900/20 text-red-300'
        }`}>
          ❌ {error}
        </div>
      )}

      {/* Posts List */}
      {loading ? (
        <div className={`rounded-2xl border p-8 text-center ${
          isLightMode
            ? 'bg-white border-slate-200'
            : 'bg-slate-800/40 border-slate-700'
        }`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
            Loading posts...
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className={`rounded-2xl border p-12 text-center ${
          isLightMode
            ? 'bg-white border-slate-200'
            : 'bg-slate-800/40 border-slate-700'
        }`}>
          <p className={`text-lg mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            {filterBy === 'all' ? '📭 No posts yet' : filterBy === 'flagged' ? '✅ No flagged posts' : '📭 No appeals'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`rounded-2xl border p-6 ${
                post.is_flagged
                  ? isLightMode
                    ? 'bg-red-50 border-red-200'
                    : 'bg-red-900/20 border-red-700'
                  : isLightMode
                  ? 'bg-white border-slate-200'
                  : 'bg-slate-800/40 border-slate-700'
              }`}
            >
              {/* Post Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {post.author_username}
                    </h4>
                    {post.is_flagged && (
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        isLightMode
                          ? 'bg-red-200 text-red-700'
                          : 'bg-red-600/30 text-red-300'
                      }`}>
                        🚩 FLAGGED
                      </span>
                    )}
                    {post.has_appeal && (
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        isLightMode
                          ? 'bg-amber-200 text-amber-700'
                          : 'bg-amber-600/30 text-amber-300'
                      }`}>
                        📢 APPEAL
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                    Posted {formatRelativeTime(post.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex gap-2 text-sm">
                    <span className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      👁️ {post.view_count || 0} views
                    </span>
                    <span className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      💬 {post.comment_count} comments
                    </span>
                    <span className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      ❤️ {post.like_count} likes
                    </span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <p className={`text-sm leading-relaxed mb-4 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                {post.content}
              </p>

              {/* Flag Reason */}
              {post.is_flagged && post.flag_reason && (
                <div className={`rounded-lg p-3 mb-4 ${
                  isLightMode
                    ? 'bg-red-100 border border-red-300'
                    : 'bg-red-900/30 border border-red-700'
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-red-700' : 'text-red-300'}`}>
                    Flag Reason:
                  </p>
                  <p className={`text-sm ${isLightMode ? 'text-red-700' : 'text-red-300'}`}>
                    {post.flag_reason}
                  </p>
                </div>
              )}

              {/* Appeal Text */}
              {post.has_appeal && post.appeal_text && (
                <div className={`rounded-lg p-3 mb-4 ${
                  isLightMode
                    ? 'bg-amber-100 border border-amber-300'
                    : 'bg-amber-900/30 border border-amber-700'
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
                    User Appeal:
                  </p>
                  <p className={`text-sm mb-3 ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
                    {post.appeal_text}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUnflagPost(post.id)}
                      disabled={actionLoading}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${
                        isLightMode
                          ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                          : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                      }`}
                    >
                      ✅ Accept Appeal
                    </button>
                    <button
                      onClick={() => handleDenyAppeal(post.id)}
                      disabled={actionLoading}
                      className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition ${
                        isLightMode
                          ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                          : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                      }`}
                    >
                      ❌ Deny Appeal
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {!post.is_flagged ? (
                  <button
                    onClick={() => {
                      setFlaggingPostId(post.id);
                      setShowFlagModal(true);
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      isLightMode
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    🚩 Flag Post
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnflagPost(post.id)}
                    disabled={actionLoading}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      isLightMode
                        ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                        : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                    }`}
                  >
                    ✅ Unflag Post
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl border p-6 max-w-md w-full ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-800 border-slate-700'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              🚩 Flag Post
            </h3>
            <p className={`text-sm mb-4 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Provide a reason for flagging this post. The post will be hidden from other users and a warning will be sent to the author.
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="e.g., Inappropriate content, Spam, Harassment..."
              rows={4}
              className={`w-full rounded-lg border p-3 mb-4 resize-none focus:outline-none ${
                isLightMode
                  ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-red-600'
                  : 'border-slate-600 bg-slate-900 text-white placeholder-white/50 focus:border-red-400'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason('');
                  setFlaggingPostId(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => flaggingPostId && handleFlagPost(flaggingPostId)}
                disabled={actionLoading || !flagReason.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                    : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                }`}
              >
                {actionLoading ? 'Flagging...' : 'Flag Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
