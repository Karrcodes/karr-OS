ALTER TABLE public.wellbeing_data
ADD COLUMN IF NOT EXISTS active_session JSONB DEFAULT NULL;
