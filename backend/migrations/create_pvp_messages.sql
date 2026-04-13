CREATE TABLE IF NOT EXISTS public.pvp_messages (
  id VARCHAR PRIMARY KEY,
  lobby_id VARCHAR NOT NULL REFERENCES public.pvp_lobbies(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.user_accounts(id) ON DELETE CASCADE,
  username VARCHAR(64) NOT NULL,
  full_name VARCHAR(255) NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_pvp_messages_lobby_id ON public.pvp_messages(lobby_id);
CREATE INDEX IF NOT EXISTS ix_pvp_messages_user_id ON public.pvp_messages(user_id);
CREATE INDEX IF NOT EXISTS ix_pvp_messages_created_at ON public.pvp_messages(created_at);
