-- Split travel_duration into to/from legs
ALTER TABLE public.fin_tasks DROP COLUMN IF EXISTS travel_duration;
ALTER TABLE public.fin_tasks ADD COLUMN IF NOT EXISTS travel_to_duration INTEGER DEFAULT 0;
ALTER TABLE public.fin_tasks ADD COLUMN IF NOT EXISTS travel_from_duration INTEGER DEFAULT 0;

ALTER TABLE public.fin_task_templates DROP COLUMN IF EXISTS travel_duration;
ALTER TABLE public.fin_task_templates ADD COLUMN IF NOT EXISTS travel_to_duration INTEGER DEFAULT 0;
ALTER TABLE public.fin_task_templates ADD COLUMN IF NOT EXISTS travel_from_duration INTEGER DEFAULT 0;
