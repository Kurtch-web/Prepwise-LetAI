import type { UserProfile } from '../services/api';
import { useTheme } from '../providers/ThemeProvider';

const darkCardClasses = 'rounded-3xl border border-emerald-500/20 bg-[#064e3b]/80 p-6 shadow-[0_18px_40px_rgba(6,78,59,0.45)] backdrop-blur-xl';
const lightCardClasses = 'rounded-3xl border border-emerald-200 bg-white/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl';

export function UserProfileCard({ user }: { user: UserProfile }) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';
  const cardClasses = isLightMode ? lightCardClasses : darkCardClasses;
  
  const roleColor = isLightMode
    ? user.role === 'admin'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-emerald-100 text-emerald-700'
    : user.role === 'admin'
    ? 'bg-purple-500/20 text-purple-300'
    : 'bg-emerald-500/20 text-emerald-300';
  
  const userCreatedDate = new Date(user.createdAt).toLocaleDateString();

  return (
    <div className={cardClasses}>
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {/* User Info */}
        <div>
          <h3 className={`mb-4 text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>User Profile</h3>
          
          <div className="space-y-3">
            <div>
              <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Username</p>
              <p className={`text-lg font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{user.username}</p>
            </div>

            {user.fullName && (
              <div>
                <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Full Name</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-700' : 'text-white/90'}`}>{user.fullName}</p>
              </div>
            )}

            {user.email && (
              <div>
                <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Email</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-700' : 'text-white/90'}`}>{user.email}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleColor}`}>
                {user.role === 'admin' ? '👑 Admin' : '👤 User'}
              </span>
              {user.reviewType && (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isLightMode
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {user.reviewType}
                </span>
              )}
            </div>

            <div className="pt-2">
              <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Joined</p>
              <p className={`text-sm ${isLightMode ? 'text-slate-700' : 'text-white/90'}`}>{userCreatedDate}</p>
            </div>

            {user.targetExamDate && (
              <div>
                <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Target Exam Date</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-700' : 'text-white/90'}`}>{user.targetExamDate}</p>
              </div>
            )}

            {user.instructorId && (
              <div>
                <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Assigned Instructor</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-700' : 'text-white/90'}`}>ID: {user.instructorId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Assessment Data */}
        <div>
          <h3 className={`mb-4 text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Assessment</h3>
          
          {user.assessment ? (
            <div className="space-y-4">
              <div className={`rounded-2xl border p-4 ${
                isLightMode
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-white/10 bg-white/5'
              }`}>
                <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Primary Method</p>
                <p className={`text-lg font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{user.assessment.recommendations.primary_method}</p>
              </div>

              <div>
                <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Secondary Methods</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.assessment.recommendations.secondary_methods.map((method, idx) => (
                    <span key={idx} className={`rounded-full px-3 py-1 text-xs ${
                      isLightMode
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {method}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Study Duration</p>
                <p className={`text-sm ${isLightMode ? 'text-slate-700' : 'text-white/90'}`}>{user.assessment.recommendations.suggested_duration}</p>
              </div>

              {user.assessment.recommendations.weak_areas.length > 0 && (
                <div>
                  <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Areas to Focus</p>
                  <div className="mt-2 space-y-1">
                    {user.assessment.recommendations.weak_areas.map((area, idx) => (
                      <p key={idx} className={`text-xs ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>⚠️ {area}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <p className={`text-xs uppercase tracking-wide ${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>Assessment Date</p>
                <p className={`text-xs ${isLightMode ? 'text-slate-700' : 'text-white/90'}`}>
                  {new Date(user.assessment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-center rounded-2xl border ${
              isLightMode
                ? 'border-dashed border-slate-300 bg-slate-50'
                : 'border-dashed border-white/20 bg-white/5'
            } py-8 text-center`}>
              <p className={isLightMode ? 'text-sm text-slate-600' : 'text-sm text-white/60'}>No assessment yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
