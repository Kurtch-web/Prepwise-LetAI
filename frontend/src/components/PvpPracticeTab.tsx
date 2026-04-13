import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { PracticeTestSession } from '../services/progressService';
import { authService } from '../services/authService';
import pvpService, { PvpLobby, PvpLobbyQuiz } from '../services/pvpService';

interface PvpPracticeTabProps {
  availableSessions: PracticeTestSession[];
  isLightMode: boolean;
}

export function PvpPracticeTab({ availableSessions, isLightMode }: PvpPracticeTabProps) {
  const me = authService.getUser();
  const myUserId = me?.id;

  const [joinCode, setJoinCode] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const [lobby, setLobby] = useState<PvpLobby | null>(null);
  const [quiz, setQuiz] = useState<PvpLobbyQuiz | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleCreateLobby = async (quizId: string) => {
    setError(null);
    setLoading(true);
    try {
      const created = await pvpService.createLobby(quizId, 4);
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
      <div className="space-y-6">
        <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
          <h3 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>PvP</h3>
          <p className={`mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Create a lobby or join with a code. You can only join if you already completed the same test.
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
          <h4 className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Create Lobby</h4>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
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
                    disabled={Object.keys(answers).length !== quiz.total_questions || loading}
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

        <div className={`rounded-2xl border p-6 h-fit ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/40 border-slate-700'}`}>
          <div className={`text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Leaderboard</div>
          <div className="mt-4 space-y-3">
            {sortedParticipants.map(p => {
              const progressText = p.is_finished
                ? 'Finished'
                : p.current_question_index > 0
                  ? `Q${p.current_question_index}`
                  : 'Not started';

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 flex items-center justify-between ${
                    isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/20 border-slate-600'
                  }`}
                >
                  <div className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{p.full_name || p.username}</div>
                  <div className={`font-extrabold ${isLightMode ? 'text-blue-700' : 'text-blue-300'}`}>{progressText}</div>
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
      </div>
    </div>
  );
}
