CREATE TABLE IF NOT EXISTS public.pvp_lobbies (
  id VARCHAR PRIMARY KEY,
  code VARCHAR(8) NOT NULL UNIQUE,
  host_user_id INTEGER NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  quiz_id VARCHAR NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'lobby',
  max_players INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS ix_pvp_lobbies_code ON public.pvp_lobbies(code);
CREATE INDEX IF NOT EXISTS ix_pvp_lobbies_host_user_id ON public.pvp_lobbies(host_user_id);
CREATE INDEX IF NOT EXISTS ix_pvp_lobbies_quiz_id ON public.pvp_lobbies(quiz_id);
CREATE INDEX IF NOT EXISTS ix_pvp_lobbies_status ON public.pvp_lobbies(status);
CREATE INDEX IF NOT EXISTS ix_pvp_lobbies_created_at ON public.pvp_lobbies(created_at);

CREATE TABLE IF NOT EXISTS public.pvp_participants (
  id VARCHAR PRIMARY KEY,
  lobby_id VARCHAR NOT NULL REFERENCES public.pvp_lobbies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  username VARCHAR(64) NOT NULL,
  full_name VARCHAR(255) NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_question_index INTEGER NOT NULL DEFAULT 0,
  is_finished BOOLEAN NOT NULL DEFAULT FALSE,
  finished_at TIMESTAMPTZ NULL,
  score INTEGER NULL,
  correct_count INTEGER NULL,
  total_questions INTEGER NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pvp_participant_lobby_user UNIQUE (lobby_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_pvp_participants_lobby_id ON public.pvp_participants(lobby_id);
CREATE INDEX IF NOT EXISTS ix_pvp_participants_user_id ON public.pvp_participants(user_id);
CREATE INDEX IF NOT EXISTS ix_pvp_participants_joined_at ON public.pvp_participants(joined_at);
CREATE INDEX IF NOT EXISTS ix_pvp_participants_is_finished ON public.pvp_participants(is_finished);
CREATE INDEX IF NOT EXISTS ix_pvp_participants_updated_at ON public.pvp_participants(updated_at);
