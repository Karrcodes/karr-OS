-- Nutrition Library Table
CREATE TABLE IF NOT EXISTS public.nutrition_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    fat INTEGER NOT NULL,
    ingredients JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Nutrition Fridge Inventory Table
CREATE TABLE IF NOT EXISTS public.nutrition_fridge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    meal_id UUID REFERENCES public.nutrition_library(id) ON DELETE CASCADE NOT NULL,
    portions INTEGER DEFAULT 1 NOT NULL,
    prep_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.nutrition_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_fridge ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors on re-run
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own library' AND tablename = 'nutrition_library') THEN
        DROP POLICY "Users can view their own library" ON public.nutrition_library;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can modify their own library' AND tablename = 'nutrition_library') THEN
        DROP POLICY "Users can modify their own library" ON public.nutrition_library;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own fridge' AND tablename = 'nutrition_fridge') THEN
        DROP POLICY "Users can view their own fridge" ON public.nutrition_fridge;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can modify their own fridge' AND tablename = 'nutrition_fridge') THEN
        DROP POLICY "Users can modify their own fridge" ON public.nutrition_fridge;
    END IF;
END $$;

-- Policies for Library
CREATE POLICY "Users can view their own library" ON public.nutrition_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify their own library" ON public.nutrition_library FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for Fridge
CREATE POLICY "Users can view their own fridge" ON public.nutrition_fridge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can modify their own fridge" ON public.nutrition_fridge FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
