-- Ensure wellbeing_data has the milestones column
ALTER TABLE public.wellbeing_data 
ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.wellbeing_data.milestones IS 'Stores user fitness milestones (weights, lifts, etc.) as a JSON array.';
