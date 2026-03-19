import { useEffect, useState, useMemo } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { Post, postsService } from '../services/postsService';
import { CreatePostForm } from './CreatePostForm';
import { PostCard } from './PostCard';

type PostSortOption = 'new' | 'old' | 'liked';

export function PostFeed() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLightMode = theme === 'light';
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<PostSortOption>('new');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await postsService.fetchPosts(0, 50);
      setPosts(result.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = async () => {
    await loadPosts();
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts.filter(post =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort posts
    if (sortBy === 'new') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'old') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'liked') {
      filtered.sort((a, b) => b.like_count - a.like_count);
    }

    return filtered;
  }, [posts, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Create Post Form - Admin Only */}
      {user?.role === 'admin' && (
        <CreatePostForm onPostCreated={handlePostCreated} isLoading={loading} />
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h2 className={`text-2xl font-bold ${
            isLightMode ? 'text-slate-900' : 'text-white'
          }`}>
            📝 Community Posts
          </h2>
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

        {/* Search Box */}
        <div className={`rounded-xl border p-3 ${
          isLightMode
            ? 'bg-white border-slate-300'
            : 'bg-slate-800/50 border-slate-700'
        }`}>
          <input
            type="text"
            placeholder="🔍 Search posts by content or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-lg border p-3 focus:outline-none ${
              isLightMode
                ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-emerald-600'
                : 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-emerald-400'
            }`}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSortBy('new')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              sortBy === 'new'
                ? isLightMode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 text-white'
                : isLightMode
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ✨ New Post
          </button>
          <button
            onClick={() => setSortBy('old')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              sortBy === 'old'
                ? isLightMode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 text-white'
                : isLightMode
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📅 Old Post
          </button>
          <button
            onClick={() => setSortBy('liked')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
              sortBy === 'liked'
                ? isLightMode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 text-white'
                : isLightMode
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            ❤️ Most Liked
          </button>
        </div>

        {error && (
          <div className={`rounded-2xl border p-5 ${
            isLightMode
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-red-500/30 bg-red-900/20 text-red-300'
          }`}>
            ❌ {error}
          </div>
        )}

        {loading ? (
          <div className={`rounded-2xl border p-12 text-center ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-800/40 border-slate-700'
          }`}>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Loading posts...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-800/40 border-slate-700'
          }`}>
            <p className={`text-lg mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              📭 No posts yet
            </p>
            <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              {user?.role === 'admin'
                ? 'Be the first to create a post!'
                : 'Check back soon for updates from the community'}
            </p>
          </div>
        ) : filteredAndSortedPosts.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-800/40 border-slate-700'
          }`}>
            <p className={`text-lg mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              🔍 No posts found
            </p>
            <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Try adjusting your search or filter options
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`text-sm font-medium ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Showing {filteredAndSortedPosts.length} post{filteredAndSortedPosts.length !== 1 ? 's' : ''}
            </p>
            {filteredAndSortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
