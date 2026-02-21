-- Add status column to fin_rota_overrides
ALTER TABLE public.fin_rota_overrides 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' 
CHECK (status IN ('pending', 'approved'));

-- Update existing holidays to 'pending' to match new logic if desired, 
-- or leave as approved if they were already confirmed by the user.
-- For safety, we'll leave existing ones as 'approved'.
