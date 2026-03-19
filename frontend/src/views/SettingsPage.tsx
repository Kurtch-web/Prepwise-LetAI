import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { API_BASE } from '../config/backends';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [reviewType, setReviewType] = useState(user?.reviewType || 'GenEd');
  const [targetExamDate, setTargetExamDate] = useState(user?.targetExamDate || '');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

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
      </div>
    </div>
  );
}
