-- Drop existing table if redefining or just add column
ALTER TABLE public.nutrition_library ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'snack';
