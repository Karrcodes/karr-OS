-- Wellbeing Profile Table
CREATE TABLE IF NOT EXISTS public.wellbeing_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    age INTEGER,
    weight FLOAT, -- last measured weight
    height INTEGER,
    gender TEXT,
    activity_level TEXT,
    goal TEXT,
    goal_weight FLOAT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Wellbeing Data Table
CREATE TABLE IF NOT EXISTS public.wellbeing_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    weight_history JSONB DEFAULT '[]'::jsonb,
    routines JSONB DEFAULT '[]'::jsonb,
    active_routine_id TEXT,
    workout_logs JSONB DEFAULT '[]'::jsonb,
    gym_stats JSONB DEFAULT '{}'::jsonb,
    meal_logs JSONB DEFAULT '[]'::jsonb,
    saved_recipes JSONB DEFAULT '[]'::jsonb,
    mood_logs JSONB DEFAULT '[]'::jsonb,
    reflections JSONB DEFAULT '[]'::jsonb,
    dashboard_layout JSONB DEFAULT '{"main": [{"id": "macros", "isVisible": true}, {"id": "weight_trends", "isVisible": true}, {"id": "active_protocol", "isVisible": true}, {"id": "meal_planner", "isVisible": true}, {"id": "mood_reflection", "isVisible": true}], "sidebar": [{"id": "nutritional_trends", "isVisible": true}, {"id": "workout_consistency", "isVisible": true}, {"id": "gym_activity", "isVisible": true}]}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.wellbeing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors on re-run
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own wellbeing profile' AND tablename = 'wellbeing_profiles') THEN
        DROP POLICY "Users can view their own wellbeing profile" ON public.wellbeing_profiles;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own wellbeing profile' AND tablename = 'wellbeing_profiles') THEN
        DROP POLICY "Users can insert their own wellbeing profile" ON public.wellbeing_profiles;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own wellbeing profile' AND tablename = 'wellbeing_profiles') THEN
        DROP POLICY "Users can update their own wellbeing profile" ON public.wellbeing_profiles;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own wellbeing data' AND tablename = 'wellbeing_data') THEN
        DROP POLICY "Users can view their own wellbeing data" ON public.wellbeing_data;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own wellbeing data' AND tablename = 'wellbeing_data') THEN
        DROP POLICY "Users can insert their own wellbeing data" ON public.wellbeing_data;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own wellbeing data' AND tablename = 'wellbeing_data') THEN
        DROP POLICY "Users can update their own wellbeing data" ON public.wellbeing_data;
    END IF;
END $$;

CREATE POLICY "Users can view their own wellbeing profile" ON public.wellbeing_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wellbeing profile" ON public.wellbeing_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wellbeing profile" ON public.wellbeing_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own wellbeing data" ON public.wellbeing_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wellbeing data" ON public.wellbeing_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wellbeing data" ON public.wellbeing_data FOR UPDATE USING (auth.uid() = user_id);
