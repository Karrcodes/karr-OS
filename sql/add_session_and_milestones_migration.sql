-- Migration to add session and milestone persistence to wellbeing_data
ALTER TABLE public.wellbeing_data 
ADD COLUMN IF NOT EXISTS active_session JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.wellbeing_data.active_session IS 'Stores the current in-progress workout session state for cross-device persistence.';
COMMENT ON COLUMN public.wellbeing_data.milestones IS 'Stores the user defined milestones and progress for the fitness module.';
