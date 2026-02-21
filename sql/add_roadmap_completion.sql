-- Migration to add completion status to roadmap items
ALTER TABLE public.sys_roadmap ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
