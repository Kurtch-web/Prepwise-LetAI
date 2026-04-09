import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { API_BASE } from '../config/backends';
import { Post, postsService } from '../services/postsService';
import { formatRelativeTime } from '../utils/dateFormatter';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [reviewType, setReviewType] = useState(user?.reviewType || 'GenEd');
  const [targetExamDate, setTargetExamDate] = useState(user?.targetExamDate || '');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  
  // Posts state
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedFlaggedPost, setSelectedFlaggedPost] = useState<Post | null>(null);
  const [appealText, setAppealText] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);

  // Load user posts on mount
  useEffect(() => {
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
      setAppealText('');
      setSelectedFlaggedPost(null);
      // Reload posts to show updated appeal status
      const result = await postsService.fetchPosts(0, 100);
      const myPosts = result.posts.filter(post => post.author_id === user?.id);
      setUserPosts(myPosts);
    } catch (error) {
      setAppealError(error instanceof Error ? error.message : 'Failed to submit appeal');
    } finally {
      setAppealLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
        : 'bg-[#051b15]'
    }`}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-black mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            ⚙️ Settings
          </h1>
          <p className={`text-base ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Customize your learning preferences
          </p>
        </div>

        {/* Settings Card */}
        <div className={`rounded-2xl p-8 backdrop-blur-xl border transition-all duration-300 ${
          isLightMode
            ? 'bg-white/95 border-slate-200 shadow-lg'
            : 'bg-slate-800/50 border-slate-700 shadow-2xl'
        }`}>
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
        </div>

        {/* My Posts Section */}
        <div className="mt-8">
          <h2 className={`text-2xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📝 My Posts
          </h2>

          {postsLoading ? (
            <div className={`rounded-2xl p-8 text-center ${
              isLightMode
                ? 'bg-white/95 border border-slate-200'
                : 'bg-slate-800/50 border border-slate-700'
            }`}>
              <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>Loading posts...</p>
            </div>
          ) : userPosts.length === 0 ? (
            <div className={`rounded-2xl p-8 text-center ${
              isLightMode
                ? 'bg-white/95 border border-slate-200'
                : 'bg-slate-800/50 border border-slate-700'
            }`}>
              <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>No posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post) => (
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
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-semibold px-2 py-1 rounded ${
                          post.category === 'user' ? 'bg-purple-100 text-purple-700' :
                          post.category === 'admin' ? 'bg-red-100 text-red-700' :
                          post.category === 'news' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {post.category === 'user' && '👤 User'}
                          {post.category === 'admin' && '🛡️ Admin'}
                          {post.category === 'news' && '📰 News'}
                          {post.category === 'important' && '⚠️ Important'}
                        </span>
                        {post.is_flagged && (
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            isLightMode
                              ? 'bg-red-200 text-red-700'
                              : 'bg-red-600/30 text-red-300'
                          }`}>
                            🚩 FLAGGED
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
                        {formatRelativeTime(post.created_at)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className={isLightMode ? 'text-slate-600' : 'text-white/60'}>
                        👁️ {post.view_count} views
                      </p>
                      <p className={isLightMode ? 'text-slate-600' : 'text-white/60'}>
                        💬 {post.comment_count} comments
                      </p>
                    </div>
                  </div>

                  <p className={`text-sm leading-relaxed mb-4 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                    {post.content}
                  </p>

                  {post.is_flagged && (
                    <div className={`rounded-lg p-3 mb-4 ${
                      isLightMode
                        ? 'bg-red-100 border border-red-300'
                        : 'bg-red-900/30 border border-red-700'
                    }`}>
                      <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-red-700' : 'text-red-300'}`}>
                        ⚠️ Flag Reason:
                      </p>
                      <p className={`text-sm ${isLightMode ? 'text-red-700' : 'text-red-300'}`}>
                        {post.flag_reason}
                      </p>
                      {post.has_appeal && (
                        <div className={`mt-3 pt-3 border-t ${isLightMode ? 'border-red-300' : 'border-red-700'}`}>
                          <p className={`text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
                            📢 Your Appeal:
                          </p>
                          <p className={`text-sm ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
                            {post.appeal_text}
                          </p>
                          <p className={`text-xs mt-2 ${isLightMode ? 'text-amber-600' : 'text-amber-400'}`}>
                            ⏳ Awaiting admin review...
                          </p>
                        </div>
                      )}
                      {!post.has_appeal && (
                        <button
                          onClick={() => {
                            setSelectedFlaggedPost(post);
                            setAppealText('');
                            setAppealError(null);
                          }}
                          className={`mt-3 w-full px-4 py-2 rounded-lg font-semibold text-sm transition ${
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
              ))}
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
