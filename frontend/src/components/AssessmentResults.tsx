import { useTheme } from '../providers/ThemeProvider';
import { AssessmentItem } from '../services/api';

interface AssessmentResultsProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentItem | null;
}

export function AssessmentResults({ isOpen, onClose, assessment }: AssessmentResultsProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  if (!isOpen || !assessment) return null;

  const { learning_preferences: prefs, recommendations: recs } = assessment;

  // Sort preferences for visual display
  const sortedPreferences = Object.entries(prefs)
    .sort(([, a], [, b]) => b - a)
    .map(([key, value]) => ({
      name: key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1),
      value: Math.round(value * 100),
      color: value > 0.7 ? 'bg-green-500' : value > 0.4 ? 'bg-blue-500' : 'bg-slate-400'
    }));

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      isLightMode ? 'bg-black/50' : 'bg-black/70'
    }`}>
      <div className={`rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
        isLightMode ? 'bg-white' : 'bg-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📊 Your Assessment Results
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl leading-none ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            ✕
          </button>
        </div>

        {/* Date Info */}
        <div className={`mb-6 p-4 rounded-lg ${
          isLightMode ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'
        }`}>
          <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Assessment completed on: {new Date(assessment.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Primary Recommendation */}
        <div className={`mb-8 p-6 rounded-xl border-2 ${
          isLightMode 
            ? 'border-green-200 bg-green-50' 
            : 'border-green-800/50 bg-green-900/20'
        }`}>
          <h3 className={`font-bold mb-2 ${isLightMode ? 'text-green-900' : 'text-green-300'}`}>
            🎯 Recommended Primary Learning Method
          </h3>
          <p className={`text-lg font-semibold ${isLightMode ? 'text-green-800' : 'text-green-200'}`}>
            {recs.primary_method}
          </p>
        </div>

        {/* Learning Preferences Bar Chart */}
        <div className="mb-8">
          <h3 className={`font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📈 Your Learning Preferences
          </h3>
          <div className="space-y-3">
            {sortedPreferences.map((pref) => (
              <div key={pref.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                    {pref.name}
                  </span>
                  <span className={`text-sm font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {pref.value}%
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${isLightMode ? 'bg-slate-200' : 'bg-slate-700'}`}>
                  <div
                    className={`h-full rounded-full transition-all ${pref.color}`}
                    style={{ width: `${pref.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Methods */}
        {recs.secondary_methods.length > 0 && (
          <div className="mb-8">
            <h3 className={`font-semibold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              🔄 Secondary Learning Methods
            </h3>
            <div className="flex flex-wrap gap-2">
              {recs.secondary_methods.map((method) => (
                <div
                  key={method}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    isLightMode 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-blue-900/30 text-blue-300'
                  }`}
                >
                  {method}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Study Duration */}
        <div className="mb-8">
          <h3 className={`font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            ⏰ Suggested Study Duration
          </h3>
          <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
            {recs.suggested_duration}
          </p>
        </div>

        {/* Weak Areas */}
        {recs.weak_areas.length > 0 && (
          <div className="mb-8">
            <h3 className={`font-semibold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              ⚠️ Areas to Focus On
            </h3>
            <ul className="space-y-2">
              {recs.weak_areas.map((area) => (
                <li
                  key={area}
                  className={`flex items-start gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}
                >
                  <span className={`mt-1 ${isLightMode ? 'text-orange-500' : 'text-orange-400'}`}>•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strengths */}
        {recs.strengths.length > 0 && (
          <div className="mb-8">
            <h3 className={`font-semibold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              ✨ Your Strengths
            </h3>
            <ul className="space-y-2">
              {recs.strengths.map((strength) => (
                <li
                  key={strength}
                  className={`flex items-start gap-2 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}
                >
                  <span className={`mt-1 ${isLightMode ? 'text-green-500' : 'text-green-400'}`}>✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Priority Guides */}
        {recs.priority_guides.length > 0 && (
          <div className="mb-8">
            <h3 className={`font-semibold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              📚 Recommended Study Guides to Start With
            </h3>
            <ul className="space-y-2">
              {recs.priority_guides.map((guide) => (
                <li
                  key={guide}
                  className={`px-4 py-2 rounded-lg ${
                    isLightMode 
                      ? 'bg-slate-100 text-slate-800' 
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {guide}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
              isLightMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Close & Start Learning
          </button>
        </div>
      </div>
    </div>
  );
}
