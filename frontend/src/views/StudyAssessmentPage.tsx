import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { TakeAssessmentModal } from '../components/TakeAssessmentModal';
import api from '../services/api';
import { formatRelativeTime } from '../utils/dateFormatter';

interface AssessmentTemplate {
  id: string;
  name: string;
  description?: string;
  questions: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_id: number;
}

export function StudyAssessmentPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLightMode = theme === 'light';
  const [assessmentTemplates, setAssessmentTemplates] = useState<AssessmentTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentTemplate | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setBackendError(null);
      console.log('Checking backend connectivity...');

      // Check if backend is reachable
      try {
        await api.healthCheck();
        console.log('Backend is reachable');
      } catch (healthErr) {
        console.warn('Backend health check failed:', healthErr);
        setBackendError('⚠️ Backend server is not running. Please ensure the backend is started at http://localhost:8000');
      }

      console.log('Fetching assessment templates...');
      const response = await api.fetchAssessmentTemplates();
      console.log('Assessment templates fetched:', response.templates);
      setAssessmentTemplates(response.templates || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch assessment templates:', errorMessage);
      setBackendError(`Failed to load assessments: ${errorMessage}`);
      setAssessmentTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className={`transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
        : 'bg-[#051b15]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate('/materials/study-guides')}
          className={`mb-8 px-4 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          ← Back to Study Guides
        </button>

        {/* Header */}
        <div className="mb-12">
          <h1 className={`text-4xl font-black mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📝 Study Assessment
          </h1>
          <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Practice and evaluate your knowledge with comprehensive assessments
          </p>
        </div>

        {/* Backend Error Alert */}
        {backendError && (
          <div className={`rounded-2xl border p-6 mb-6 ${
            isLightMode
              ? 'border-amber-300 bg-amber-50'
              : 'border-amber-500/30 bg-amber-900/20'
          }`}>
            <p className={`text-sm mb-4 ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>
              {backendError}
            </p>
            <button
              onClick={() => fetchTemplates()}
              className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                isLightMode
                  ? 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                  : 'bg-amber-700 text-white hover:bg-amber-600'
              }`}
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* Content Area */}
        {loadingTemplates ? (
          <div className={`rounded-2xl border p-12 text-center ${
            isLightMode
              ? 'border-slate-200 bg-white shadow-lg'
              : 'border-slate-700 bg-slate-800/50 shadow-lg'
          }`}>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Loading assessments...
            </p>
          </div>
        ) : !backendError && assessmentTemplates.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center ${
            isLightMode
              ? 'border-slate-200 bg-white shadow-lg'
              : 'border-slate-700 bg-slate-800/50 shadow-lg'
          }`}>
            <div className="mb-6 text-6xl">📝</div>
            <h2 className={`text-3xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              No assessments available yet
            </h2>
            <p className={`text-lg max-w-2xl mx-auto mb-8 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Check back soon for comprehensive study assessments from your instructor.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => fetchTemplates()}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => navigate('/materials/study-guides')}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                Back to Study Guides
              </button>
              <button
                onClick={() => navigate('/materials')}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  isLightMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                View All Materials
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className={`rounded-2xl border p-6 ${
              isLightMode
                ? 'border-slate-200 bg-white shadow-lg'
                : 'border-slate-700 bg-slate-800/50 shadow-lg'
            }`}>
              <h2 className={`text-2xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                📝 Study Assessments Available
              </h2>
              <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {assessmentTemplates.length} assessment{assessmentTemplates.length !== 1 ? 's' : ''} available for you to practice
              </p>
            </div>

            <div className="grid gap-4">
              {assessmentTemplates.map((assessment) => (
                <button
                  key={assessment.id}
                  onClick={() => setSelectedAssessment(assessment)}
                  className={`rounded-2xl border p-6 text-left transition ${
                    isLightMode
                      ? 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-lg cursor-pointer'
                      : 'border-slate-700 bg-slate-800/50 hover:border-emerald-400 hover:shadow-lg cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {assessment.name}
                      </h3>
                      {assessment.description && (
                        <p className={`text-sm mb-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          {assessment.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          isLightMode
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          📝 {assessment.questions.length} question{assessment.questions.length !== 1 ? 's' : ''}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          isLightMode
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          Created {formatRelativeTime(assessment.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition ${
                      isLightMode
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      Take Assessment →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Take Assessment Modal */}
      {selectedAssessment && (
        <TakeAssessmentModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
          onSuccess={() => {
            setSelectedAssessment(null);
          }}
        />
      )}
    </div>
  );
}
