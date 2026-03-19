import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTheme } from '../providers/ThemeProvider';
import { formatRelativeTime } from '../utils/dateFormatter';

interface AssessmentQuestion {
  title: string;
  description: string;
  choices: string[];
}

interface AssessmentTemplate {
  id: string;
  name: string;
  description?: string;
  questions: AssessmentQuestion[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  creator_id: number;
}

interface AssessmentTemplatesListProps {
  onTemplateDeleted?: () => void;
}

export function AssessmentTemplatesList({ onTemplateDeleted }: AssessmentTemplatesListProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setError(null);
      const response = await api.fetchAdminAssessmentTemplates();
      setTemplates(response.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assessment templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(templateId);
    try {
      await api.deleteAssessmentTemplate(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
      setSelectedTemplate(null);
      onTemplateDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete assessment template');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl border p-8 text-center ${
        isLightMode
          ? 'bg-white border-slate-200'
          : 'bg-slate-800/40 border-slate-700'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
        <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
          Loading assessments...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border p-4 ${
        isLightMode
          ? 'border-red-300 bg-red-50 text-red-700'
          : 'border-red-500/30 bg-red-900/20 text-red-300'
      }`}>
        ❌ {error}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className={`rounded-2xl border p-12 text-center ${
        isLightMode
          ? 'bg-white border-slate-200'
          : 'bg-slate-800/40 border-slate-700'
      }`}>
        <p className={`text-lg mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          📋 No assessment surveys yet
        </p>
        <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
          Create your first assessment survey to get started
        </p>
      </div>
    );
  }

  // List view - show only names
  if (!selectedTemplate) {
    return (
      <div className="space-y-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template)}
            className={`w-full text-left rounded-2xl border p-4 transition ${
              isLightMode
                ? 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer'
                : 'bg-slate-800/40 border-slate-700 hover:border-emerald-400 hover:bg-slate-800/60 cursor-pointer'
            }`}
          >
            <h3 className={`text-lg font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {template.name}
            </h3>
            <p className={`text-sm ${isLightMode ? 'text-slate-500' : 'text-white/50'}`}>
              {template.questions.length} question{template.questions.length !== 1 ? 's' : ''} • Click to view details
            </p>
          </button>
        ))}
      </div>
    );
  }

  // Expanded view - show full details
  return (
    <div className={`rounded-2xl border p-6 space-y-6 ${
      isLightMode
        ? 'bg-white border-slate-200'
        : 'bg-slate-800/40 border-slate-700'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <button
            onClick={() => setSelectedTemplate(null)}
            className={`inline-flex items-center gap-2 text-sm font-semibold mb-4 transition ${
              isLightMode
                ? 'text-emerald-600 hover:text-emerald-700'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            ← Back to Surveys
          </button>
          <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            {selectedTemplate.name}
          </h2>
          {selectedTemplate.description && (
            <p className={`text-sm mt-2 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              {selectedTemplate.description}
            </p>
          )}
        </div>
        <button
          onClick={() => handleDelete(selectedTemplate.id, selectedTemplate.name)}
          disabled={deletingId === selectedTemplate.id}
          className={`flex-shrink-0 px-4 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {deletingId === selectedTemplate.id ? '⏳ Deleting...' : '🗑️ Delete'}
        </button>
      </div>

      {/* Survey Details */}
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs px-3 py-1 rounded-full ${
            isLightMode
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-emerald-500/20 text-emerald-300'
          }`}>
            📝 {selectedTemplate.questions.length} question{selectedTemplate.questions.length !== 1 ? 's' : ''}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full ${
            isLightMode
              ? 'bg-blue-100 text-blue-700'
              : 'bg-blue-500/20 text-blue-300'
          }`}>
            ✓ Active
          </span>
        </div>
        <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
          Created {formatRelativeTime(selectedTemplate.created_at)}
        </p>
      </div>

      {/* Questions Section */}
      <div>
        <h3 className={`text-lg font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
          Questions ({selectedTemplate.questions.length})
        </h3>
        {selectedTemplate.questions.length === 0 ? (
          <div className={`rounded-2xl border p-6 text-center ${
            isLightMode
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-900/20 border-slate-700'
          }`}>
            <p className={`${isLightMode ? 'text-slate-600' : 'text-white/60'}`}>
              No questions in this survey yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedTemplate.questions.map((question, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border p-4 ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-900/20 border-slate-700'
                }`}
              >
                <div>
                  <h4 className={`font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    Q{idx + 1}: {question.title}
                  </h4>
                  {question.description && (
                    <p className={`text-sm mb-3 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      {question.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                    isLightMode ? 'text-slate-600' : 'text-white/60'
                  }`}>
                    Answer Choices:
                  </p>
                  <div className="space-y-1">
                    {question.choices.map((choice, cIdx) => (
                      <div
                        key={cIdx}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          isLightMode
                            ? 'bg-white border border-slate-200'
                            : 'bg-slate-800/30 border border-slate-700'
                        }`}
                      >
                        <span className={`font-semibold ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          {String.fromCharCode(65 + cIdx)}.
                        </span>
                        {' '}
                        <span className={isLightMode ? 'text-slate-700' : 'text-white/80'}>
                          {choice}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
