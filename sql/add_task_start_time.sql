-- Add missing start_time column for planner appointments
ALTER TABLE public.fin_tasks
ADD COLUMN IF NOT EXISTS start_time TEXT;

-- Trigger schema cache reload in PostgREST
NOTIFY pgrst, 'reload schema';
