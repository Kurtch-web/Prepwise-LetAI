import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import questionsService, { QuestionData } from '../services/questionsService';
import { API_BASE } from '../config/backends';

interface Question extends QuestionData {
  created_at: string;
}

interface DetectedMCQ {
  question_text: string;
  choices: string[];
  correct_answer: string;
  category: string;
  needs_review: boolean;
  source: string;
}

export function QuestionsBank() {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  const [view, setView] = useState<'list' | 'upload-pdf' | 'review-detected' | 'create-manual'>('list');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF Upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfCategory, setPdfCategory] = useState('General Education');
  const [pdfBatchName, setPdfBatchName] = useState('');

  // Detected MCQs state
  const [detectedMCQs, setDetectedMCQs] = useState<DetectedMCQ[]>([]);
  const [selectedMCQs, setSelectedMCQs] = useState<Set<number>>(new Set());

  // Manual creation state
  const [manualQuestion, setManualQuestion] = useState({
    text: '',
    choices: ['', '', '', ''],
    correctAnswer: 'A',
    category: 'General Education',
    batchName: ''
  });

  const [categories, setCategories] = useState(['General Education', 'Professional Education']);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadQuestions();
    loadCategories();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await questionsService.listQuestions();
      setQuestions(response.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await questionsService.getCategories();
      setCategories(response.categories);
    } catch (err) {
      // Fallback to defaults
    }
  };

  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are allowed');
        return;
      }
      setError(null);
      setPdfFile(file);
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create form data with PDF file
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('category', pdfCategory);

      // Get auth token
      const token = localStorage.getItem('auth_token');

      // Call MCQ detection endpoint
      const response = await fetch(`${API_BASE}/api/questions/detect-from-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to detect MCQs from PDF');
      }

      const data = await response.json();

      if (data.mcqs && data.mcqs.length > 0) {
        // Show detected MCQs for review
        setDetectedMCQs(data.mcqs);
        setSelectedMCQs(new Set(data.mcqs.map((_, idx) => idx))); // Select all by default
        setView('review-detected');
      } else {
        setError(data.warnings?.[0] || 'No MCQs detected in the PDF');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = async () => {
    if (!manualQuestion.text.trim()) {
      setError('Question text is required');
      return;
    }

    const filledChoices = manualQuestion.choices.filter(c => c.trim());
    if (filledChoices.length < 2) {
      setError('At least 2 answer choices are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await questionsService.createQuestion(
        manualQuestion.text,
        filledChoices,
        manualQuestion.correctAnswer,
        manualQuestion.category,
        'manual',
        manualQuestion.batchName.trim() || undefined
      );

      setManualQuestion({
        text: '',
        choices: ['', '', '', ''],
        correctAnswer: 'A',
        category: 'General Education',
        batchName: ''
      });
      await loadQuestions();
      setView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        await questionsService.deleteQuestion(id);
        await loadQuestions();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete question');
      }
    }
  };

  const handleSaveDetectedMCQs = async () => {
    if (selectedMCQs.size === 0) {
      setError('Please select at least one question to save');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Filter selected MCQs and add batch name
      const mcqsToSave = detectedMCQs
        .filter((_, idx) => selectedMCQs.has(idx))
        .map(mcq => ({
          ...mcq,
          batch_name: pdfBatchName.trim() || undefined
        }));

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/questions/save-detected-mcqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mcqsToSave),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to save MCQs');
      }

      // Reset state and go back to list
      setPdfFile(null);
      setPdfBatchName('');
      setDetectedMCQs([]);
      setSelectedMCQs(new Set());
      const fileInput = document.getElementById('pdf-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await loadQuestions();
      setView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save MCQs');
    } finally {
      setLoading(false);
    }
  };

  const toggleMCQSelection = (index: number) => {
    const newSelected = new Set(selectedMCQs);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMCQs(newSelected);
  };

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  // List View
  if (view === 'list') {
    // Group questions by folder (batch_name)
    const groupedQuestions = questions.reduce((acc, q) => {
      const folder = q.batch_name || 'General Batch';
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(q);
      return acc;
    }, {} as Record<string, Question[]>);

    // Filter questions by search query
    const filteredGroupedQuestions = Object.entries(groupedQuestions).reduce((acc, [folder, folderQuestions]) => {
      const filtered = folderQuestions.filter(q =>
        q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.choices.some(choice => choice.toLowerCase().includes(searchQuery.toLowerCase())) ||
        q.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[folder] = filtered;
      }
      return acc;
    }, {} as Record<string, Question[]>);

    return (
      <div className="space-y-6">
        <div className="flex gap-3 flex-wrap items-center">
          <button
            onClick={() => setView('upload-pdf')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              isLightMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            📄 Upload PDF
          </button>
          <button
            onClick={() => setView('create-manual')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              isLightMode
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            ➕ Create Question
          </button>
          <input
            type="text"
            placeholder="🔍 Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-4 py-3 rounded-lg border transition flex-1 min-w-xs ${
              isLightMode
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-white'
                : 'bg-slate-900/20 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-900/40'
            } focus:outline-none`}
          />
        </div>

        {error && (
          <div className={`rounded-2xl border p-4 ${
            isLightMode
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-red-500/30 bg-red-900/20 text-red-300'
          }`}>
            ❌ {error}
          </div>
        )}

        {questions.length === 0 ? (
          <div className={`rounded-2xl border ${
            isLightMode
              ? 'border-slate-200 bg-white'
              : 'border-slate-700 bg-slate-900/40'
          }`}>
            <div className="p-12 text-center">
              <p className={`text-lg mb-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                📚 No questions yet
              </p>
              <p className={isLightMode ? 'text-slate-500' : 'text-slate-500'}>
                Upload a PDF or create your first question to get started
              </p>
            </div>
          </div>
        ) : Object.keys(filteredGroupedQuestions).length === 0 && searchQuery ? (
          <div className={`rounded-2xl border ${
            isLightMode
              ? 'border-slate-200 bg-white'
              : 'border-slate-700 bg-slate-900/40'
          }`}>
            <div className="p-12 text-center">
              <p className={`text-lg mb-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                🔍 No matching questions
              </p>
              <p className={isLightMode ? 'text-slate-500' : 'text-slate-500'}>
                Try different search terms
              </p>
            </div>
          </div>
        ) : (
          Object.entries(filteredGroupedQuestions).map(([folder, folderQuestions]) => {
            const isFolderExpanded = expandedFolders.has(folder);
            return (
              <div
                key={folder}
                className={`rounded-2xl border overflow-hidden ${
                  isLightMode
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-700 bg-slate-900/40'
                }`}
              >
                <div className={`p-4 border-b ${
                  isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700'
                }`}>
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="w-full text-left flex items-center justify-between gap-3 hover:opacity-80 transition"
                  >
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      <span className={`text-lg transition-transform ${
                        isFolderExpanded ? 'rotate-90' : ''
                      }`}>
                        ▶
                      </span>
                      📁 {folder}
                      <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${
                        isLightMode ? 'bg-slate-200 text-slate-600' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {folderQuestions.length}
                      </span>
                    </h3>
                  </button>
                </div>
                {isFolderExpanded && (
                  <div className="p-6 space-y-3">
                    {folderQuestions.map((question) => (
                  <div
                    key={question.id}
                    className={`rounded-lg p-4 border ${
                      isLightMode
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-slate-700 bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            question.source === 'pdf' || question.source === 'pdf_import'
                              ? isLightMode
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-blue-900/30 text-blue-300'
                              : isLightMode
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-emerald-900/30 text-emerald-300'
                          }`}>
                            {question.source === 'pdf' || question.source === 'pdf_import' ? '📄 PDF' : '✏️ Manual'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isLightMode
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {question.category}
                          </span>
                        </div>
                        <p className={`font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          {question.question_text}
                        </p>
                        <div className="space-y-1 text-sm">
                          {question.choices.map((choice, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            const isCorrect = letter === question.correct_answer;
                            // Strip any existing letter prefix if present (A., B., etc.)
                            const cleanChoice = choice.replace(/^[A-D][\.\)]\s*/, '');
                            return (
                              <p
                                key={idx}
                                className={isCorrect
                                  ? isLightMode
                                    ? 'text-green-700 font-semibold'
                                    : 'text-green-400 font-semibold'
                                  : isLightMode
                                  ? 'text-slate-600'
                                  : 'text-slate-400'
                                }
                              >
                                {isCorrect ? '✓ ' : '  '}{letter}. {cleanChoice}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className={`flex-shrink-0 px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          isLightMode
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  // PDF Upload View
  if (view === 'upload-pdf') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'text-blue-600 hover:text-blue-700'
              : 'text-blue-400 hover:text-blue-300'
          }`}
        >
          ← Back
        </button>

        <div className={`rounded-2xl border p-8 space-y-6 ${
          isLightMode
            ? 'border-slate-200 bg-white'
            : 'border-slate-700 bg-slate-900/40'
        }`}>
          <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📄 Upload PDF
          </h2>

          {error && (
            <div className={`rounded-2xl border p-4 ${
              isLightMode
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-red-500/30 bg-red-900/20 text-red-300'
            }`}>
              ❌ {error}
            </div>
          )}

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Folder Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Batch 1 - 2024"
              value={pdfBatchName}
              onChange={(e) => setPdfBatchName(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border transition ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white'
                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-blue-500 focus:bg-slate-900/40'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Select Category
            </label>
            <select
              value={pdfCategory}
              onChange={(e) => setPdfCategory(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border transition ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500 focus:bg-white'
                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-blue-500 focus:bg-slate-900/40'
              } focus:outline-none`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Choose PDF File
            </label>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
              isLightMode
                ? 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
                : 'border-slate-600 bg-slate-900/20 hover:border-blue-400 hover:bg-blue-900/20'
            }`}>
              <input
                id="pdf-input"
                type="file"
                accept=".pdf"
                onChange={handlePdfFileSelect}
                className="hidden"
              />
              <label htmlFor="pdf-input" className="cursor-pointer">
                <div className="text-4xl mb-3">📄</div>
                <p className={`font-semibold mb-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  Click to upload PDF
                </p>
                <p className={isLightMode ? 'text-slate-600' : 'text-slate-400'}>
                  {pdfFile ? pdfFile.name : 'or drag and drop'}
                </p>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUploadPdf}
              disabled={loading || !pdfFile}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? 'Uploading...' : '📤 Upload PDF'}
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review Detected MCQs View
  if (view === 'review-detected') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => {
            setView('upload-pdf');
            setDetectedMCQs([]);
            setSelectedMCQs(new Set());
          }}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'text-blue-600 hover:text-blue-700'
              : 'text-blue-400 hover:text-blue-300'
          }`}
        >
          ← Back
        </button>

        <div className={`rounded-2xl border p-8 space-y-6 ${
          isLightMode
            ? 'border-slate-200 bg-white'
            : 'border-slate-700 bg-slate-900/40'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              📋 Review Detected MCQs
            </h2>
            <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Found {detectedMCQs.length} questions. Review and select which ones to save.
            </p>
          </div>

          {error && (
            <div className={`rounded-2xl border p-4 ${
              isLightMode
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-red-500/30 bg-red-900/20 text-red-300'
            }`}>
              ❌ {error}
            </div>
          )}

          <div className="space-y-4">
            {detectedMCQs.map((mcq, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 cursor-pointer transition ${
                  selectedMCQs.has(idx)
                    ? isLightMode
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-blue-500/50 bg-blue-900/20'
                    : isLightMode
                    ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
                onClick={() => toggleMCQSelection(idx)}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedMCQs.has(idx)}
                    onChange={() => toggleMCQSelection(idx)}
                    className="mt-1 w-5 h-5 accent-blue-600 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        mcq.needs_review
                          ? isLightMode
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-amber-900/30 text-amber-300'
                          : isLightMode
                          ? 'bg-green-100 text-green-700'
                          : 'bg-green-900/30 text-green-300'
                      }`}>
                        {mcq.needs_review ? '⚠️ Review' : '✓ Detected'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isLightMode
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {mcq.category}
                      </span>
                    </div>
                    <p className={`font-semibold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      Q{idx + 1}. {mcq.question_text}
                    </p>
                    <div className="space-y-1">
                      {mcq.choices.map((choice, choiceIdx) => {
                        const letter = String.fromCharCode(65 + choiceIdx);
                        const isCorrect = letter === mcq.correct_answer;
                        // Strip any existing letter prefix if present
                        const cleanChoice = choice.replace(/^[A-D][\.\)]\s*/, '');
                        return (
                          <p
                            key={choiceIdx}
                            className={`text-sm ${
                              isCorrect
                                ? isLightMode
                                  ? 'text-green-700 font-semibold'
                                  : 'text-green-400 font-semibold'
                                : isLightMode
                                ? 'text-slate-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {isCorrect ? '✓ ' : '  '}{letter}. {cleanChoice}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveDetectedMCQs}
              disabled={loading || selectedMCQs.size === 0}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? 'Saving...' : `💾 Save ${selectedMCQs.size} Question${selectedMCQs.size !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={() => setView('upload-pdf')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Manual Creation View
  if (view === 'create-manual') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            isLightMode
              ? 'text-emerald-600 hover:text-emerald-700'
              : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          ← Back
        </button>

        <div className={`rounded-2xl border p-8 space-y-6 ${
          isLightMode
            ? 'border-slate-200 bg-white'
            : 'border-slate-700 bg-slate-900/40'
        }`}>
          <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            ➕ Create Question
          </h2>

          {error && (
            <div className={`rounded-2xl border p-4 ${
              isLightMode
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-red-500/30 bg-red-900/20 text-red-300'
            }`}>
              ❌ {error}
            </div>
          )}

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Folder Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Manual Quiz 1"
              value={manualQuestion.batchName}
              onChange={(e) => setManualQuestion({ ...manualQuestion, batchName: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Category
            </label>
            <select
              value={manualQuestion.category}
              onChange={(e) => setManualQuestion({ ...manualQuestion, category: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border transition ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
              } focus:outline-none`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Question Text *
            </label>
            <textarea
              value={manualQuestion.text}
              onChange={(e) => setManualQuestion({ ...manualQuestion, text: e.target.value })}
              placeholder="Enter your question here"
              className={`w-full px-4 py-3 rounded-lg border transition ${
                isLightMode
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                  : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
              } focus:outline-none`}
              rows={3}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Answer Choices
            </label>
            <div className="space-y-3">
              {manualQuestion.choices.map((choice, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder={`Choice ${letter}`}
                      value={choice}
                      onChange={(e) => {
                        const newChoices = [...manualQuestion.choices];
                        newChoices[idx] = e.target.value;
                        setManualQuestion({ ...manualQuestion, choices: newChoices });
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg border transition ${
                        isLightMode
                          ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500 focus:bg-white'
                          : 'bg-slate-900/20 border-slate-600 text-white focus:border-emerald-500 focus:bg-slate-900/40'
                      } focus:outline-none`}
                    />
                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
                      manualQuestion.correctAnswer === letter
                        ? isLightMode
                          ? 'bg-green-100'
                          : 'bg-green-900/30'
                        : isLightMode
                        ? 'hover:bg-slate-100'
                        : 'hover:bg-slate-900/20'
                    }`}>
                      <input
                        type="radio"
                        name="correct-answer"
                        value={letter}
                        checked={manualQuestion.correctAnswer === letter}
                        onChange={(e) => setManualQuestion({ ...manualQuestion, correctAnswer: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className={`text-sm font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        Correct
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreateManual}
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? 'Creating...' : '✓ Create Question'}
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
