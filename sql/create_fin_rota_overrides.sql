-- Create Rota Overrides Table
CREATE TABLE IF NOT EXISTS public.fin_rota_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('overtime', 'absence', 'holiday')),
    profile TEXT NOT NULL DEFAULT 'personal',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, profile)
);

-- Enable RLS
ALTER TABLE public.fin_rota_overrides ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own rota overrides" 
ON public.fin_rota_overrides FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own rota overrides" 
ON public.fin_rota_overrides FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own rota overrides" 
ON public.fin_rota_overrides FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete their own rota overrides" 
ON public.fin_rota_overrides FOR DELETE 
USING (true);
