-- Add missing core columns if they don't exist
ALTER TABLE public.nutrition_library ADD COLUMN IF NOT EXISTS type TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.nutrition_library ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '🍽️';
ALTER TABLE public.nutrition_library ADD COLUMN IF NOT EXISTS is_combo BOOLEAN DEFAULT FALSE;

-- Create Nutrition Combo Contents Table
CREATE TABLE IF NOT EXISTS public.nutrition_combo_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID REFERENCES public.nutrition_library(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.nutrition_library(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for Combo Contents
ALTER TABLE public.nutrition_combo_contents ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own combo contents' AND tablename = 'nutrition_combo_contents') THEN
        DROP POLICY "Users can view their own combo contents" ON public.nutrition_combo_contents;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can modify their own combo contents' AND tablename = 'nutrition_combo_contents') THEN
        DROP POLICY "Users can modify their own combo contents" ON public.nutrition_combo_contents;
    END IF;
END $$;

CREATE POLICY "Users can view their own combo contents" ON public.nutrition_combo_contents 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.nutrition_library 
            WHERE id = combo_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can modify their own combo contents" ON public.nutrition_combo_contents 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.nutrition_library 
            WHERE id = combo_id AND user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.nutrition_library 
            WHERE id = combo_id AND user_id = auth.uid()
        )
    );
