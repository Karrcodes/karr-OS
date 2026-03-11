-- Migration to add dashboard_layout to wellbeing_data
ALTER TABLE public.wellbeing_data 
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT '{"main": [{"id": "macros", "isVisible": true}, {"id": "weight_trends", "isVisible": true}, {"id": "active_protocol", "isVisible": true}, {"id": "meal_planner", "isVisible": true}, {"id": "mood_reflection", "isVisible": true}], "sidebar": [{"id": "nutritional_trends", "isVisible": true}, {"id": "workout_consistency", "isVisible": true}, {"id": "gym_activity", "isVisible": true}]}'::jsonb;

-- Fix existing rows that might have been initialized with empty arrays
UPDATE public.wellbeing_data
SET dashboard_layout = '{"main": [{"id": "macros", "isVisible": true}, {"id": "weight_trends", "isVisible": true}, {"id": "active_protocol", "isVisible": true}, {"id": "meal_planner", "isVisible": true}, {"id": "mood_reflection", "isVisible": true}], "sidebar": [{"id": "nutritional_trends", "isVisible": true}, {"id": "workout_consistency", "isVisible": true}, {"id": "gym_activity", "isVisible": true}]}'::jsonb
WHERE dashboard_layout = '{"main": [], "sidebar": []}'::jsonb OR dashboard_layout IS NULL;

-- Comment for documentation
COMMENT ON COLUMN public.wellbeing_data.dashboard_layout IS 'Stores the dynamic layout configuration (visibility and order) for the Wellbeing Overview dashboard.';
