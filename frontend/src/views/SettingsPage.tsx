import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { API_BASE } from '../config/backends';
import { Post, postsService } from '../services/postsService';
import { formatRelativeTime } from '../utils/dateFormatter';

type SettingsTab = 'profile' | 'posts';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [reviewType, setReviewType] = useState(user?.reviewType || 'GenEd');
  const [targetExamDate, setTargetExamDate] = useState(user?.targetExamDate || '');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  
  // Posts state
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedFlaggedPost, setSelectedFlaggedPost] = useState<Post | null>(null);
  const [appealText, setAppealText] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [postDetailFilter, setPostDetailFilter] = useState<'latest' | 'most-liked' | 'least-liked'>('latest');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<Post | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load user posts function
  const loadUserPosts = async () => {
    setPostsLoading(true);
    try {
      const result = await postsService.fetchPosts(0, 100);
      // Filter posts by current user
      const myPosts = result.posts.filter(post => post.author_id === user?.id);
      setUserPosts(myPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  // Load user posts on mount
  useEffect(() => {
    if (user?.id) {
      loadUserPosts();
    }
  }, [user?.id]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          review_type: reviewType,
          target_exam_date: targetExamDate || null
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { detail?: string }).detail || 'Failed to update profile');
      }

      const result = await response.json();
      
      // Update localStorage with new user data
      if (result.user) {
        localStorage.setItem('auth_user', JSON.stringify({
          ...user,
          reviewType: result.user.reviewType,
          targetExamDate: result.user.targetExamDate
        }));
      }

      setSubmitSuccess('Profile updated successfully!');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!selectedFlaggedPost || !appealText.trim()) {
      setAppealError('Please enter an appeal message');
      return;
    }

    setAppealLoading(true);
    setAppealError(null);
    try {
      await postsService.submitAppeal(selectedFlaggedPost.id, appealText);
      setSelectedFlaggedPost(null);
      setAppealText('');
      await loadUserPosts();
    } catch (err) {
      setAppealError(err instanceof Error ? err.message : 'Failed to submit appeal');
      setAppealLoading(false);
    }
  };

  const handleDeletePost = (post: Post) => {
    setDeleteConfirmPost(post);
    setDeleteError(null);
  };

  const confirmDeletePost = async () => {
    if (!deleteConfirmPost) return;

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await postsService.deletePost(deleteConfirmPost.id);
      setSelectedPost(null);
      setDeleteConfirmPost(null);
      await loadUserPosts();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete post');
      setDeleteLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
        : 'bg-[#051b15]'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-black mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            ⚙️ Settings
          </h1>
          <p className={`text-base ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Manage your account and posts
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b" style={{
          borderColor: isLightMode ? '#e2e8f0' : '#334155'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-semibold border-b-2 transition-all ${
              activeTab === 'profile'
                ? isLightMode
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-emerald-500 text-emerald-400'
                : isLightMode
                ? 'border-transparent text-slate-600 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            👤 Profile
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 font-semibold border-b-2 transition-all ${
              activeTab === 'posts'
                ? isLightMode
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-emerald-500 text-emerald-400'
                : isLightMode
                ? 'border-transparent text-slate-600 hover:text-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            📝 My Posts
          </button>
        </div>

        {/* Settings Card */}
        <div className={`rounded-2xl p-8 backdrop-blur-xl border transition-all duration-300 ${
          isLightMode
            ? 'bg-white/95 border-slate-200 shadow-lg'
            : 'bg-slate-800/50 border-slate-700 shadow-2xl'
        }`}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Profile Info Section */}
            <div className={`rounded-lg p-4 ${
              isLightMode
                ? 'bg-slate-50 border border-slate-200'
                : 'bg-slate-700/30 border border-slate-700'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Profile Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className={`text-sm font-medium ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                    Username
                  </label>
                  <p className={`mt-1 text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {user?.username}
                  </p>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                    Full Name
                  </label>
                  <p className={`mt-1 text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {user?.fullName}
                  </p>
                </div>
              </div>
            </div>

            {/* Learning Preferences Section */}
            <div className={`rounded-lg p-4 ${
              isLightMode
                ? 'bg-slate-50 border border-slate-200'
                : 'bg-slate-700/30 border border-slate-700'
            }`}>
              <h2 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Learning Preferences
              </h2>
              
              <div className="space-y-4">
                {/* Review Type */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    Review Type <span className="text-emerald-600">*</span>
                  </label>
                  <select
                    value={reviewType}
                    onChange={(e) => setReviewType(e.target.value)}
                    className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                      isLightMode
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    } outline-none`}
                  >
                    <option value="GenEd">📚 General Education (GenEd)</option>
                    <option value="ProfEd">🎓 Professional Education (ProfEd)</option>
                  </select>
                  <p className={`text-xs mt-1.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Choose the type of LET exam you're preparing for
                  </p>
                </div>

                {/* Target Exam Date */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isLightMode ? 'text-slate-900' : 'text-white'
                  }`}>
                    Target Exam Date <span className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>(Optional)</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={targetExamDate}
                    onChange={(e) => setTargetExamDate(e.target.value)}
                    className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                      isLightMode
                        ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                        : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                    } outline-none`}
                  />
                  <p className={`text-xs mt-1.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Set a target date to personalize your study schedule
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            {submitError && (
              <div className={`rounded-lg p-4 text-sm font-medium ${
                isLightMode
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-red-900/20 border border-red-800 text-red-300'
              }`}>
                <p className="flex items-center gap-2">
                  <span>❌</span> {submitError}
                </p>
              </div>
            )}

            {submitSuccess && (
              <div className={`rounded-lg p-4 text-sm font-medium ${
                isLightMode
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-emerald-900/20 border border-emerald-800 text-emerald-300'
              }`}>
                <p className="flex items-center gap-2">
                  <span>✅</span> {submitSuccess}
                </p>
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:-translate-y-0 transition-all duration-300"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin">⏳</span> Saving...
                </span>
              ) : (
                '💾 Save Settings'
              )}
            </button>
            </form>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-6">

              {postsLoading ? (
                <div className={`rounded-2xl p-8 text-center ${
                  isLightMode
                    ? 'bg-slate-50 border border-slate-200'
                    : 'bg-slate-700/30 border border-slate-600'
                }`}>
                  <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>Loading posts...</p>
                </div>
              ) : userPosts.length === 0 ? (
                <div className={`rounded-2xl p-8 text-center ${
                  isLightMode
                    ? 'bg-slate-50 border border-slate-200'
                    : 'bg-slate-700/30 border border-slate-600'
                }`}>
                  <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`rounded-2xl border p-4 text-left transition-all hover:shadow-lg ${
                        post.is_flagged
                          ? isLightMode
                            ? 'bg-red-50 border-red-200 hover:border-red-300'
                            : 'bg-red-900/20 border-red-700 hover:border-red-600'
                          : isLightMode
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            post.category === 'user' ? 'bg-purple-100 text-purple-700' :
                            post.category === 'admin' ? 'bg-red-100 text-red-700' :
                            post.category === 'news' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {post.category === 'user' && '👤'}
                            {post.category === 'admin' && '🛡️'}
                            {post.category === 'news' && '📰'}
                            {post.category === 'important' && '⚠️'}
                          </span>
                          {post.is_flagged && (
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              isLightMode
                                ? 'bg-red-200 text-red-700'
                                : 'bg-red-600/30 text-red-300'
                            }`}>
                              🚩
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                          {formatRelativeTime(post.created_at)}
                        </p>
                      </div>
                      <p className={`text-sm line-clamp-2 mb-2 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                        {post.content}
                      </p>
                      <div className="flex gap-3 text-xs">
                        <span className={isLightMode ? 'text-slate-600' : 'text-white/60'}>👁️ {post.view_count}</span>
                        <span className={isLightMode ? 'text-slate-600' : 'text-white/60'}>💬 {post.comment_count}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Modal - Facebook Style */}
      {selectedPost && !selectedFlaggedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-800 border-slate-700'
          }`}>
            {/* Modal Header */}
            <div className={`border-b p-6 flex items-center justify-between ${
              isLightMode
                ? 'bg-white border-slate-200'
                : 'bg-slate-800 border-slate-700'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  selectedPost.category === 'user' ? 'bg-purple-100 text-purple-700' :
                  selectedPost.category === 'admin' ? 'bg-red-100 text-red-700' :
                  selectedPost.category === 'news' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedPost.category === 'user' && '👤 User'}
                  {selectedPost.category === 'admin' && '🛡️ Admin'}
                  {selectedPost.category === 'news' && '📰 News'}
                  {selectedPost.category === 'important' && '⚠️ Important'}
                </span>
                {selectedPost.is_flagged && (
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    isLightMode
                      ? 'bg-red-200 text-red-700'
                      : 'bg-red-600/30 text-red-300'
                  }`}>
                    🚩 FLAGGED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeletePost(selectedPost)}
                  disabled={deleteLoading}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    isLightMode
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50'
                      : 'bg-red-900/30 text-red-300 hover:bg-red-900/50 disabled:opacity-50'
                  }`}
                >
                  {deleteLoading ? '🗑️ Deleting...' : '🗑️ Delete'}
                </button>
                <button
                  onClick={() => setSelectedPost(null)}
                  className={`text-2xl font-bold ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* Main Post Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Post Header */}
                  <div>
                    <p className={`text-sm mb-2 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      {formatRelativeTime(selectedPost.created_at)}
                    </p>
                  </div>

                  {/* Post Content */}
                  <div>
                    <p className={`text-lg leading-relaxed ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {selectedPost.content}
                    </p>
                  </div>

                  {/* Attachments/Images */}
                  {selectedPost.attachments && selectedPost.attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedPost.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className={`rounded-lg overflow-hidden ${
                            isLightMode ? 'bg-slate-100' : 'bg-slate-700/50'
                          }`}
                        >
                          {attachment.file_type?.startsWith('image') ? (
                            <img
                              src={attachment.file_url}
                              alt="Post attachment"
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className={`w-full h-48 flex items-center justify-center ${
                              isLightMode ? 'bg-slate-200' : 'bg-slate-700'
                            }`}>
                              <span className="text-3xl">📎</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats Bar */}
                  <div className={`flex justify-between py-4 border-t border-b ${
                    isLightMode ? 'border-slate-200' : 'border-slate-700'
                  }`}>
                    <div className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      ❤️ {selectedPost.like_count || 0} likes
                    </div>
                    <div className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                      💬 {selectedPost.comment_count} comments
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4">
                    <h3 className={`font-bold text-lg ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      💬 Comments ({selectedPost.comment_count})
                    </h3>

                    {selectedPost.comments && selectedPost.comments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedPost.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`rounded-lg p-3 ${
                              isLightMode
                                ? 'bg-slate-50 border border-slate-200'
                                : 'bg-slate-700/30 border border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                                {comment.author?.username || 'Anonymous'}
                              </p>
                              <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                                {formatRelativeTime(comment.created_at)}
                              </p>
                            </div>
                            <p className={`text-sm mb-2 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                              {comment.content}
                            </p>
                            <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                              ❤️ {comment.like_count || 0} likes
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-sm text-center py-4 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                        No comments yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Sidebar - Likes & Flag Info */}
                <div className="space-y-6">
                  {/* Likes Section */}
                  <div className={`rounded-lg p-4 ${
                    isLightMode
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-slate-700/30 border border-slate-700'
                  }`}>
                    <h3 className={`font-bold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      ❤️ Likes ({selectedPost.like_count || 0})
                    </h3>
                    {selectedPost.likes && selectedPost.likes.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPost.likes.slice(0, 10).map((like) => (
                          <div key={like.id} className={`text-sm ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                            {like.user?.username || 'Anonymous'}
                          </div>
                        ))}
                        {selectedPost.likes.length > 10 && (
                          <p className={`text-xs text-center pt-2 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                            +{selectedPost.likes.length - 10} more
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                        No likes yet
                      </p>
                    )}
                  </div>

                  {/* Flag Info */}
                  {selectedPost.is_flagged && (
                    <div className={`rounded-lg p-4 ${
                      isLightMode
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-red-900/20 border border-red-700'
                    }`}>
                      <p className={`text-sm font-semibold mb-2 ${isLightMode ? 'text-red-700' : 'text-red-300'}`}>
                        ⚠️ Post Flagged
                      </p>
                      <p className={`text-xs mb-3 ${isLightMode ? 'text-red-700' : 'text-red-300'}`}>
                        <strong>Reason:</strong> {selectedPost.flag_reason}
                      </p>

                      {selectedPost.has_appeal ? (
                        <div className={`rounded-lg p-3 ${
                          isLightMode
                            ? 'bg-amber-50 border border-amber-200'
                            : 'bg-amber-900/20 border border-amber-700'
                        }`}>
                          <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
                            📢 Your Appeal:
                          </p>
                          <p className={`text-xs ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
                            {selectedPost.appeal_text}
                          </p>
                          <p className={`text-xs mt-2 ${isLightMode ? 'text-amber-600' : 'text-amber-400'}`}>
                            ⏳ Awaiting review...
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedFlaggedPost(selectedPost);
                            setSelectedPost(null);
                            setAppealText('');
                            setAppealError(null);
                          }}
                          className={`w-full px-3 py-2 rounded-lg font-semibold text-xs transition ${
                            isLightMode
                              ? 'bg-amber-600 text-white hover:bg-amber-700'
                              : 'bg-amber-600 text-white hover:bg-amber-700'
                          }`}
                        >
                          📢 Submit Appeal
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appeal Modal */}
      {selectedFlaggedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl border p-6 max-w-md w-full ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-800 border-slate-700'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              📢 Appeal Flagged Post
            </h3>
            <p className={`text-sm mb-4 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Explain why you believe this post should not be flagged. The admin will review your appeal.
            </p>
            {appealError && (
              <div className={`rounded-lg p-3 mb-4 text-sm ${
                isLightMode
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-red-900/20 border border-red-700 text-red-300'
              }`}>
                ❌ {appealError}
              </div>
            )}
            <textarea
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="Explain why this post should be unflagged..."
              rows={4}
              className={`w-full rounded-lg border p-3 mb-4 resize-none focus:outline-none ${
                isLightMode
                  ? 'border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:border-amber-600'
                  : 'border-slate-600 bg-slate-900 text-white placeholder-white/50 focus:border-amber-400'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedFlaggedPost(null);
                  setAppealText('');
                  setAppealError(null);
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
                onClick={handleSubmitAppeal}
                disabled={appealLoading || !appealText.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50'
                    : 'bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50'
                }`}
              >
                {appealLoading ? 'Submitting...' : 'Submit Appeal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl border p-6 max-w-md w-full ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-800 border-slate-700'
          }`}>
            <h3 className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              🗑️ Delete Post?
            </h3>
            <p className={`text-sm mb-4 ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            {deleteError && (
              <div className={`rounded-lg p-3 mb-4 text-sm ${
                isLightMode
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-red-900/20 border border-red-700 text-red-300'
              }`}>
                ❌ {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeleteConfirmPost(null);
                  setDeleteError(null);
                }}
                disabled={deleteLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:opacity-50'
                    : 'bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePost}
                disabled={deleteLoading}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                    : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                }`}
              >
                {deleteLoading ? '⏳ Deleting...' : '🗑️ Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
