-- Add travel_duration to tasks and templates
ALTER TABLE public.fin_tasks ADD COLUMN IF NOT EXISTS travel_duration INTEGER DEFAULT 0;
ALTER TABLE public.fin_task_templates ADD COLUMN IF NOT EXISTS travel_duration INTEGER DEFAULT 0;
