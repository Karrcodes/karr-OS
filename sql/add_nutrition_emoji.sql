-- Add emoji column to nutrition_library
ALTER TABLE public.nutrition_library ADD COLUMN IF NOT EXISTS emoji TEXT;
