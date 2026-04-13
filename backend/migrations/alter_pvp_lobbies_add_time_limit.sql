ALTER TABLE public.pvp_lobbies
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER NULL;

CREATE INDEX IF NOT EXISTS ix_pvp_lobbies_time_limit_minutes ON public.pvp_lobbies(time_limit_minutes);
