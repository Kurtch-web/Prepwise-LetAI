import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { PracticeTestSession } from '../services/progressService';
import { authService } from '../services/authService';
import pvpService, { CustomQuizSummary, PvpChatMessage, PvpLobby, PvpLobbyQuiz } from '../services/pvpService';

interface PvpPracticeTabProps {
  availableSessions: PracticeTestSession[];
  isLightMode: boolean;
}

export function PvpPracticeTab({ availableSessions, isLightMode }: PvpPracticeTabProps) {
  const me = authService.getUser();
  const myUserId = me?.id;

  const autoSubmittedRef = useRef(false);

  const [joinCode, setJoinCode] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(10);

  const [lobby, setLobby] = useState<PvpLobby | null>(null);
  const [quiz, setQuiz] = useState<PvpLobbyQuiz | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customQuizzes, setCustomQuizzes] = useState<CustomQuizSummary[]>([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [deletingCustomId, setDeletingCustomId] = useState<string | null>(null);

  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customBuilderError, setCustomBuilderError] = useState<string | null>(null);
  const [customBuilderSaving, setCustomBuilderSaving] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<Array<{ question_text: string; choices: string[]; correct_answer: string }>>([
    { question_text: '', choices: ['', '', '', ''], correct_answer: 'A' }
  ]);

  const [chatMessages, setChatMessages] = useState<PvpChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  const loadCustomQuizzes = async () => {
    setCustomError(null);
    setCustomLoading(true);
    try {
      const quizzes = await pvpService.listCustomQuizzes();
      setCustomQuizzes(quizzes);
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : 'Failed to load custom tests');
    } finally {
      setCustomLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!lobby?.id) return;
    const content = chatInput.trim();
    if (!content) return;

    setChatError(null);
    setChatInput('');
    try {
      await pvpService.sendLobbyMessage(lobby.id, content);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to send message');
      setChatInput(content);
    }
  };

  const handleDeleteCustomQuiz = async (quizId: string) => {
    const ok = window.confirm('Delete this custom test?');
    if (!ok) return;

    setDeletingCustomId(quizId);
    setCustomError(null);
    try {
      await pvpService.deleteCustomQuiz(quizId);
      await loadCustomQuizzes();
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : 'Failed to delete custom test');
    } finally {
      setDeletingCustomId(null);
    }
  };

  useEffect(() => {
    loadCustomQuizzes().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!lobby?.id) {
      setChatMessages([]);
      setChatInput('');
      setChatError(null);
      return;
    }

    let cancelled = false;
    const lobbyId = lobby.id;

    const load = async () => {
      try {
        setChatLoading(true);
        setChatError(null);
        const msgs = await pvpService.getLobbyMessages(lobbyId);
        if (!cancelled) setChatMessages(msgs);
      } catch (err) {
        if (!cancelled) setChatError(err instanceof Error ? err.message : 'Failed to load chat');
      } finally {
        if (!cancelled) setChatLoading(false);
      }
    };

    load().catch(() => undefined);

    const channel = supabase
      .channel(`pvp-chat-${lobbyId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pvp_messages', filter: `lobby_id=eq.${lobbyId}` },
        (payload: any) => {
          if (cancelled) return;
          const row = payload?.new;
          if (!row?.id) {
            load().catch(() => undefined);
            return;
          }

          setChatMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const next = [...prev, {
              id: String(row.id),
              lobby_id: String(row.lobby_id),
              user_id: Number(row.user_id),
              username: String(row.username || ''),
              full_name: row.full_name ?? null,
              content: String(row.content || ''),
              created_at: String(row.created_at || new Date().toISOString()),
            }];

            next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [lobby?.id]);

  const myParticipant = useMemo(() => {
    if (!lobby) return null;
    if (myUserId != null) {
      return lobby.participants.find(p => p.user_id === myUserId) ?? null;
    }
    if (me?.username) {
      return lobby.participants.find(p => p.username === me.username) ?? null;
    }
    return null;
  }, [lobby, myUserId, me?.username]);

  const isHost = lobby && myUserId != null ? lobby.host_user_id === myUserId : false;

  const formatSeconds = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const openCustomBuilder = () => {
    setCustomTitle('');
    setCustomDescription('');
    setCustomBuilderError(null);
    setCustomBuilderSaving(false);
    setCustomQuestions([{ question_text: '', choices: ['', '', '', ''], correct_answer: 'A' }]);
    setShowCustomBuilder(true);
  };

  const handleSaveCustomQuiz = async () => {
    const title = customTitle.trim();
    if (!title) {
      setCustomBuilderError('Title is required');
      return;
    }

    const normalized = customQuestions.map((q) => ({
      question_text: q.question_text.trim(),
      choices: q.choices.map((c) => c.trim()),
      correct_answer: q.correct_answer
    }));

    for (const q of normalized) {
      if (!q.question_text) {
        setCustomBuilderError('All questions must have text');
        return;
      }
      if (q.choices.length !== 4 || q.choices.some((c) => !c)) {
        setCustomBuilderError('Each question must have 4 choices');
        return;
      }
      if (!['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
        setCustomBuilderError('Each question must have a correct answer');
        return;
      }
    }

    setCustomBuilderError(null);
    setCustomBuilderSaving(true);
    try {
      await pvpService.createCustomQuiz({
        title,
        description: customDescription.trim() ? customDescription.trim() : null,
        questions: normalized
      });
      setShowCustomBuilder(false);
      await loadCustomQuizzes();
    } catch (err) {
      setCustomBuilderError(err instanceof Error ? err.message : 'Failed to save custom test');
    } finally {
      setCustomBuilderSaving(false);
    }
  };

  const getFinishTimeLabel = (pFinishedAt?: string | null) => {
    if (!lobby?.started_at || !pFinishedAt) return null;
    const startedMs = new Date(lobby.started_at).getTime();
    const finishedMs = new Date(pFinishedAt).getTime();
    if (!Number.isFinite(startedMs) || !Number.isFinite(finishedMs)) return null;
    const elapsedSeconds = Math.max(0, Math.floor((finishedMs - startedMs) / 1000));
    return formatSeconds(elapsedSeconds);
  };

  const refreshLobby = async (lobbyId: string) => {
    try {
      const updated = await pvpService.getLobby(lobbyId);
      setLobby(updated);
    } catch {
      return;
    }
  };

  useEffect(() => {
    if (!lobby?.id) return;

    let cancelled = false;
    const lobbyId = lobby.id;
    const channel = supabase
      .channel(`pvp-${lobbyId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pvp_lobbies', filter: `id=eq.${lobbyId}` },
        () => {
          if (cancelled) return;
          refreshLobby(lobbyId).catch(() => undefined);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pvp_participants', filter: `lobby_id=eq.${lobbyId}` },
        () => {
          if (cancelled) return;
          refreshLobby(lobbyId).catch(() => undefined);
        }
      )
      .subscribe();

    const intervalId = window.setInterval(() => {
      if (cancelled) return;
      refreshLobby(lobbyId).catch(() => undefined);
    }, 5000);

    refreshLobby(lobbyId).catch(() => undefined);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [lobby?.id]);

  useEffect(() => {
    if (!lobby?.id) return;
    if (lobby.status !== 'in_progress') return;
    if (quiz) return;

    setLoading(true);
    pvpService
      .getLobbyQuiz(lobby.id)
      .then(q => {
        setQuiz(q);
        setCurrentQuestionIndex(0);
        setAnswers({});
        return pvpService.updateProgress(lobby.id, 1);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      })
      .finally(() => setLoading(false));
  }, [lobby?.id, lobby?.status, quiz]);

  useEffect(() => {
    if (!lobby?.started_at || lobby.status !== 'in_progress') {
      setTimeRemainingSeconds(null);
      autoSubmittedRef.current = false;
      return;
    }

    const minutes = lobby.time_limit_minutes ?? null;
    if (!minutes || minutes <= 0) {
      setTimeRemainingSeconds(null);
      autoSubmittedRef.current = false;
      return;
    }

    const startedAtMs = new Date(lobby.started_at).getTime();
    if (!Number.isFinite(startedAtMs)) {
      setTimeRemainingSeconds(null);
      autoSubmittedRef.current = false;
      return;
    }

    const endMs = startedAtMs + minutes * 60 * 1000;

    const tick = () => {
      const nowMs = Date.now();
      const remaining = Math.max(0, Math.floor((endMs - nowMs) / 1000));
      setTimeRemainingSeconds(remaining);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lobby?.started_at, lobby?.status, lobby?.time_limit_minutes]);

  useEffect(() => {
    if (!lobby || lobby.status !== 'in_progress') return;
    if (!quiz) return;
    if (timeRemainingSeconds === null) return;
    if (timeRemainingSeconds > 0) return;
    if (myParticipant?.is_finished) return;
    if (loading) return;
    if (autoSubmittedRef.current) return;

    autoSubmittedRef.current = true;
    handleFinish().catch(() => undefined);
  }, [timeRemainingSeconds, lobby?.id, lobby?.status, quiz, myParticipant?.is_finished, loading]);

  const handleCreateLobby = async (quizId: string) => {
    setError(null);
    setLoading(true);
    autoSubmittedRef.current = false;
    try {
      const created = await pvpService.createLobby(quizId, 4, timeLimitMinutes);
      setLobby(created);
      setQuiz(null);
      setSelectedQuizId(quizId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lobby');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLobby = async () => {
    const code = joinCode.trim();
    if (!code) return;

    setError(null);
    setLoading(true);
    autoSubmittedRef.current = false;
    try {
      const joined = await pvpService.joinLobby(code);
      setLobby(joined);
      setQuiz(null);
      setSelectedQuizId(joined.quiz_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join lobby');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveLobby = async () => {
    if (!lobby) return;

    setLoading(true);
    setError(null);
    try {
      await pvpService.leaveLobby(lobby.id);
    } catch {
      return;
    } finally {
      setLobby(null);
      setQuiz(null);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeRemainingSeconds(null);
      autoSubmittedRef.current = false;
      setJoinCode('');
      setSelectedQuizId(null);
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!lobby) return;

    setLoading(true);
    setError(null);
    try {
      const updated = await pvpService.startLobby(lobby.id);
      setLobby(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start match');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (!quiz || !lobby) return;
    const nextIndex = Math.min(quiz.total_questions - 1, currentQuestionIndex + 1);
    setCurrentQuestionIndex(nextIndex);
    try {
      await pvpService.updateProgress(lobby.id, nextIndex + 1);
    } catch {
      return;
    }
  };

  const handlePrev = async () => {
    if (!quiz || !lobby) return;
    const prevIndex = Math.max(0, currentQuestionIndex - 1);
    setCurrentQuestionIndex(prevIndex);
    try {
      await pvpService.updateProgress(lobby.id, prevIndex + 1);
    } catch {
      return;
    }
  };

  const handleSelectAnswer = (questionId: string, letter: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: letter }));
  };

  const handleFinish = async () => {
    if (!quiz || !lobby) return;

    setLoading(true);
    setError(null);
    try {
      await pvpService.finishMatch(lobby.id, answers);
      await refreshLobby(lobby.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish match');
    } finally {
      setLoading(false);
    }
  };

  const sortedParticipants = useMemo(() => {
    if (!lobby) return [];
    return [...lobby.participants].sort((a, b) => {
      if (a.is_finished !== b.is_finished) return a.is_finished ? -1 : 1;
      return b.current_question_index - a.current_question_index;
    });
  }, [lobby]);

  const selectedSession = useMemo(() => {
    if (!selectedQuizId) return null;
    return availableSessions.find(s => s.originalQuizId === selectedQuizId) ?? null;
  }, [availableSessions, selectedQuizId]);

  if (!lobby) {
    return (
      <>
        <div className="space-y-6">
          <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
            <h3 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>PvP</h3>
            <p className={`mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Create a lobby or join with a code. For normal tests, you can only join if you already completed the same test.
            </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Enter lobby code"
              className={`flex-1 px-4 py-3 rounded-lg border font-semibold tracking-wider ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-slate-900/20 border-slate-600 text-white'
              }`}
            />
            <button
              onClick={() => handleJoinLobby().catch(() => undefined)}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-bold ${
                isLightMode
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              } disabled:opacity-50`}
            >
              Join
            </button>
          </div>

          {error && (
            <div className={`mt-4 p-3 rounded-lg font-semibold ${isLightMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-500/10 text-red-300 border border-red-700'}`}>
              {error}
            </div>
          )}
        </div>

          <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
            <div className="flex items-center justify-between gap-3">
              <h4 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Create Lobby</h4>
              <button
                onClick={openCustomBuilder}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-bold border transition ${
                  isLightMode
                    ? 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                    : 'bg-slate-900/20 border-slate-600 text-white hover:bg-slate-800'
                } disabled:opacity-50`}
              >
                + Custom Test
              </button>
            </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-center">
            <div className={`w-full sm:w-auto font-semibold ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
              Time limit (minutes)
            </div>
            <input
              type="number"
              min={1}
              max={180}
              value={timeLimitMinutes}
              onChange={e => setTimeLimitMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
              className={`w-full sm:w-40 px-4 py-2 rounded-lg border font-semibold ${
                isLightMode
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-slate-900/20 border-slate-600 text-white'
              }`}
            />
            <div className="flex gap-2 w-full sm:w-auto">
              {[5, 10, 15, 25, 30, 60].map(m => (
                <button
                  key={m}
                  onClick={() => setTimeLimitMinutes(m)}
                  className={`flex-1 sm:flex-none px-3 py-2 rounded-lg font-bold border transition ${
                    timeLimitMinutes === m
                      ? isLightMode
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-purple-600 border-purple-600 text-white'
                      : isLightMode
                      ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                      : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

            <div className="mt-5">
              <div className={`text-sm font-bold ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                Tests Taken
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableSessions.map(session => (
                  <div
                    key={session.originalQuizId}
                    className={`rounded-xl border p-4 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/20 border-slate-600'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{session.quizTitle}</div>
                        <div className={`text-sm font-semibold mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                          Best: {Math.round(session.bestScore)}%
                        </div>
                      </div>
                      <button
                        onClick={() => handleCreateLobby(session.originalQuizId).catch(() => undefined)}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-bold ${
                          isLightMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:opacity-50`}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {availableSessions.length === 0 && (
                <div className={`mt-4 font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  No completed tests yet.
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className={`text-sm font-bold ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                Custom Tests
              </div>
              {customError && (
                <div className={`mt-3 p-3 rounded-lg font-semibold ${isLightMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-500/10 text-red-300 border border-red-700'}`}>
                  {customError}
                </div>
              )}
              {customLoading ? (
                <div className={`mt-3 font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Loading custom tests...
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customQuizzes.map((q) => (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/20 border-slate-600'}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{q.title}</div>
                          <div className={`text-sm font-semibold mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                            Questions: {q.total_questions}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleCreateLobby(q.id).catch(() => undefined)}
                            disabled={loading || deletingCustomId === q.id}
                            className={`px-4 py-2 rounded-lg font-bold ${
                              isLightMode
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            } disabled:opacity-50`}
                          >
                            Create
                          </button>
                          <button
                            onClick={() => handleDeleteCustomQuiz(q.id).catch(() => undefined)}
                            disabled={loading || deletingCustomId === q.id}
                            className={`px-4 py-2 rounded-lg font-bold border ${
                              isLightMode
                                ? 'bg-white border-red-200 text-red-700 hover:bg-red-50'
                                : 'bg-slate-900/20 border-red-500/40 text-red-300 hover:bg-red-500/10'
                            } disabled:opacity-50`}
                          >
                            {deletingCustomId === q.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!customLoading && customQuizzes.length === 0 && (
                <div className={`mt-4 font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  No custom tests yet.
                </div>
              )}
            </div>

          </div>
        </div>

        {showCustomBuilder && (
          <div
            className="fixed inset-0 z-[1200] flex items-start justify-center px-4 py-10 overflow-y-auto"
            onClick={() => setShowCustomBuilder(false)}
          >
            <div className={`absolute inset-0 ${isLightMode ? 'bg-black/30' : 'bg-black/60'} backdrop-blur-sm`} />
            <div
              className={`relative w-full max-w-3xl rounded-2xl border p-6 ${
                isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    Create Custom Test
                  </div>
                  <div className={`mt-1 text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    Add your own questions, choices, and correct answers.
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomBuilder(false)}
                  className={`text-2xl font-bold ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm font-bold ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                      Title
                    </div>
                    <input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className={`mt-2 w-full px-4 py-3 rounded-lg border font-semibold ${
                        isLightMode
                          ? 'bg-white border-slate-200 text-slate-900'
                          : 'bg-slate-900/20 border-slate-600 text-white'
                      }`}
                      placeholder="e.g. Cardio Review"
                    />
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                      Description (optional)
                    </div>
                    <input
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      className={`mt-2 w-full px-4 py-3 rounded-lg border font-semibold ${
                        isLightMode
                          ? 'bg-white border-slate-200 text-slate-900'
                          : 'bg-slate-900/20 border-slate-600 text-white'
                      }`}
                      placeholder="Short notes"
                    />
                  </div>
                </div>

                {customBuilderError && (
                  <div className={`p-3 rounded-lg font-semibold ${isLightMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-500/10 text-red-300 border border-red-700'}`}>
                    {customBuilderError}
                  </div>
                )}

                <div className="space-y-4">
                  {customQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className={`rounded-2xl border p-5 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-700'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                          Question {qIdx + 1}
                        </div>
                        <button
                          onClick={() => setCustomQuestions((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== qIdx))}
                          disabled={customQuestions.length <= 1}
                          className={`px-3 py-2 rounded-lg font-bold border transition ${
                            isLightMode
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              : 'bg-slate-900/20 border-slate-600 text-slate-200 hover:bg-slate-800'
                          } disabled:opacity-50`}
                        >
                          Remove
                        </button>
                      </div>

                      <textarea
                        value={q.question_text}
                        onChange={(e) => setCustomQuestions((prev) => prev.map((x, i) => i === qIdx ? ({ ...x, question_text: e.target.value }) : x))}
                        className={`mt-3 w-full px-4 py-3 rounded-lg border font-semibold min-h-[90px] ${
                          isLightMode
                            ? 'bg-white border-slate-200 text-slate-900'
                            : 'bg-slate-900/20 border-slate-600 text-white'
                        }`}
                        placeholder="Enter the question"
                      />

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.choices.map((choice, cIdx) => {
                          const letter = String.fromCharCode(65 + cIdx);
                          return (
                            <div key={cIdx}>
                              <div className={`text-xs font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                                Choice {letter}
                              </div>
                              <input
                                value={choice}
                                onChange={(e) => setCustomQuestions((prev) => prev.map((x, i) => {
                                  if (i !== qIdx) return x;
                                  const nextChoices = [...x.choices];
                                  nextChoices[cIdx] = e.target.value;
                                  return { ...x, choices: nextChoices };
                                }))}
                                className={`mt-1 w-full px-3 py-2 rounded-lg border font-semibold ${
                                  isLightMode
                                    ? 'bg-white border-slate-200 text-slate-900'
                                    : 'bg-slate-900/20 border-slate-600 text-white'
                                }`}
                                placeholder={`Enter choice ${letter}`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        <div className={`text-sm font-bold ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                          Correct Answer
                        </div>
                        <select
                          value={q.correct_answer}
                          onChange={(e) => setCustomQuestions((prev) => prev.map((x, i) => i === qIdx ? ({ ...x, correct_answer: e.target.value }) : x))}
                          className={`mt-2 w-full md:w-48 px-3 py-2 rounded-lg border font-bold ${
                            isLightMode
                              ? 'bg-white border-slate-200 text-slate-900'
                              : 'bg-slate-900/20 border-slate-600 text-white'
                          }`}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    onClick={() => setCustomQuestions((prev) => [...prev, { question_text: '', choices: ['', '', '', ''], correct_answer: 'A' }])}
                    className={`px-4 py-3 rounded-xl font-bold border transition ${
                      isLightMode
                        ? 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                        : 'bg-slate-900/20 border-slate-600 text-white hover:bg-slate-800'
                    }`}
                  >
                    + Add Question
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCustomBuilder(false)}
                      className={`px-5 py-3 rounded-xl font-bold ${
                        isLightMode
                          ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveCustomQuiz().catch(() => undefined)}
                      disabled={customBuilderSaving}
                      className={`px-5 py-3 rounded-xl font-bold ${
                        isLightMode
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      } disabled:opacity-50`}
                    >
                      {customBuilderSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const showScores = lobby.status === 'completed';
  const inMatch = lobby.status === 'in_progress' && !myParticipant?.is_finished;
  const waiting = lobby.status === 'in_progress' && !!myParticipant?.is_finished;

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className={`text-sm font-bold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Lobby Code</div>
            <div className={`text-2xl font-extrabold tracking-widest ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{lobby.code}</div>
            <div className={`mt-1 font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Status: {lobby.status}
              {selectedSession ? ` • ${selectedSession.quizTitle}` : ''}
            </div>
            {timeRemainingSeconds !== null && lobby.status === 'in_progress' && (
              <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                isLightMode ? 'bg-purple-100 text-purple-700' : 'bg-purple-900/30 text-purple-300'
              }`}>
                ⏱️ {formatSeconds(timeRemainingSeconds)}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {lobby.status === 'lobby' && isHost && (
              <button
                onClick={() => handleStart().catch(() => undefined)}
                disabled={loading}
                className={`px-5 py-3 rounded-lg font-bold ${
                  isLightMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                } disabled:opacity-50`}
              >
                Start Match
              </button>
            )}
            <button
              onClick={() => handleLeaveLobby().catch(() => undefined)}
              disabled={loading}
              className={`px-5 py-3 rounded-lg font-bold ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              } disabled:opacity-50`}
            >
              Leave
            </button>
          </div>
        </div>

        {error && (
          <div className={`mt-4 p-3 rounded-lg font-semibold ${isLightMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-500/10 text-red-300 border border-red-700'}`}>
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {lobby.status === 'lobby' && (
            <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className={`font-bold text-lg ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Waiting Room</div>
              <div className={`mt-2 font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Waiting for players to join. Max {lobby.max_players}.
              </div>
              {!isHost && (
                <div className={`mt-3 font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Host will start the match.
                </div>
              )}
            </div>
          )}

          {lobby.status === 'in_progress' && loading && (
            <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className={`font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>Loading match…</div>
            </div>
          )}

          {inMatch && quiz && (
            <div className={`rounded-2xl border p-6 space-y-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{quiz.title}</div>
                <div className={`text-sm font-bold px-3 py-1 rounded-full ${isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/30 text-blue-300'}`}>
                  Question {currentQuestionIndex + 1} / {quiz.total_questions}
                </div>
              </div>

              <div className={`rounded-xl border p-5 ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/20 border-slate-600'}`}>
                <div className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {quiz.questions[currentQuestionIndex]?.question_text}
                </div>

                <div className="mt-4 space-y-3">
                  {quiz.questions[currentQuestionIndex]?.choices.map((choice, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const qid = quiz.questions[currentQuestionIndex].id;
                    const isSelected = answers[qid] === letter;

                    return (
                      <button
                        key={letter}
                        onClick={() => handleSelectAnswer(qid, letter)}
                        className={`w-full rounded-lg p-4 text-left font-semibold transition border-2 ${
                          isSelected
                            ? isLightMode
                              ? 'bg-emerald-100 border-emerald-600 text-emerald-900'
                              : 'bg-emerald-900/30 border-emerald-400 text-emerald-300'
                            : isLightMode
                            ? 'bg-white border-slate-200 text-slate-900 hover:border-emerald-400'
                            : 'bg-slate-900/20 border-slate-600 text-white hover:border-emerald-400'
                        }`}
                      >
                        <span className="font-bold mr-3">{letter}.</span>
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handlePrev().catch(() => undefined)}
                  disabled={currentQuestionIndex === 0 || loading}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition ${
                    isLightMode
                      ? 'bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:opacity-50'
                      : 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50'
                  }`}
                >
                  Previous
                </button>

                {currentQuestionIndex === quiz.total_questions - 1 ? (
                  <button
                    onClick={() => handleFinish().catch(() => undefined)}
                    disabled={loading}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition ${
                      isLightMode
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50'
                    }`}
                  >
                    Finish
                  </button>
                ) : (
                  <button
                    onClick={() => handleNext().catch(() => undefined)}
                    disabled={loading}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold transition ${
                      isLightMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                    }`}
                  >
                    Next
                  </button>
                )}
              </div>

              <div className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Answered: {Object.keys(answers).length} / {quiz.total_questions}
              </div>
            </div>
          )}

          {waiting && (
            <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Waiting…</div>
              <div className={`mt-2 font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                You finished. Waiting for everyone to finish so results can be revealed.
              </div>
            </div>
          )}

          {showScores && (
            <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Final Results</div>
              <div className="mt-4 space-y-3">
                {[...sortedParticipants]
                  .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                  .map(p => (
                    <div
                      key={p.id}
                      className={`rounded-xl border p-4 flex items-center justify-between ${
                        isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/20 border-slate-600'
                      }`}
                    >
                      <div className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{p.full_name || p.username}</div>
                      <div className={`font-extrabold ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`}>
                        {(p.score ?? 0)}/{p.total_questions ?? quiz?.total_questions ?? 0}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className={`rounded-2xl border p-6 h-fit ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
            <div className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Leaderboard</div>
            <div className="mt-4 space-y-3">
              {sortedParticipants.map(p => {
                const progressText = p.is_finished
                  ? 'Finished'
                  : p.current_question_index > 0
                    ? `Q${p.current_question_index}`
                    : 'Not started';

                const finishTime = p.is_finished ? getFinishTimeLabel(p.finished_at) : null;

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 flex items-center justify-between ${
                      isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/20 border-slate-600'
                    }`}
                  >
                    <div className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{p.full_name || p.username}</div>
                    <div className="text-right">
                      <div className={`font-extrabold ${isLightMode ? 'text-blue-700' : 'text-blue-300'}`}>{progressText}</div>
                      {finishTime && (
                        <div className={`text-xs font-bold mt-1 ${isLightMode ? 'text-purple-700' : 'text-purple-300'}`}>
                          {finishTime}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {showScores && (
              <div className={`mt-6 text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Scores are now revealed.
              </div>
            )}
          </div>

          <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Chat</div>
              {chatLoading && (
                <div className={`text-xs font-bold ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Loading...
                </div>
              )}
            </div>

            {chatError && (
              <div className={`mt-3 p-3 rounded-lg font-semibold ${isLightMode ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-red-500/10 text-red-300 border border-red-700'}`}>
                {chatError}
              </div>
            )}

            <div className={`mt-4 rounded-xl border p-3 h-64 sm:h-72 overflow-y-auto ${
              isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/20 border-slate-600'
            }`}>
              {chatMessages.length === 0 ? (
                <div className={`text-sm font-semibold ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  No messages yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {chatMessages.map((m) => {
                    const isMe = myUserId != null && m.user_id === myUserId;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 border ${
                          isMe
                            ? isLightMode
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-emerald-600 border-emerald-600 text-white'
                            : isLightMode
                            ? 'bg-white border-slate-200 text-slate-900'
                            : 'bg-slate-800 border-slate-700 text-white'
                        }`}>
                          <div className={`text-xs font-bold ${isMe ? 'text-white/90' : isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
                            {m.full_name || m.username}
                          </div>
                          <div className="text-sm font-semibold whitespace-pre-wrap break-words">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendChat().catch(() => undefined);
                  }
                }}
                placeholder="Type a message..."
                className={`flex-1 px-4 py-3 rounded-lg border font-semibold ${
                  isLightMode
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-slate-900/20 border-slate-600 text-white'
                }`}
              />
              <button
                onClick={() => handleSendChat().catch(() => undefined)}
                disabled={!chatInput.trim()}
                className={`w-full sm:w-auto px-5 py-3 rounded-lg font-bold ${
                  isLightMode
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                } disabled:opacity-50`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
