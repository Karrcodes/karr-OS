-- 1. Extend fin_tasks with advanced scheduling
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS due_date_mode TEXT DEFAULT 'on' CHECK (due_date_mode IN ('on', 'before', 'range'));
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS recurrence_config JSONB DEFAULT '{}'::jsonb;

-- 2. Create Day Planner settings
CREATE TABLE IF NOT EXISTS fin_day_planner_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Generic routine settings
    wake_up_time_work TIME DEFAULT '07:00:00',
    wake_up_time_off TIME DEFAULT '09:00:00',
    bed_time_work TIME DEFAULT '22:30:00',
    bed_time_off TIME DEFAULT '00:00:00',
    
    -- Meal preferences
    meal_times JSONB DEFAULT '{
        "breakfast": "08:00",
        "lunch": "13:00",
        "dinner": "19:00"
    }'::jsonb,
    
    -- Activity durations (minutes)
    workout_duration INTEGER DEFAULT 60,
    shower_duration INTEGER DEFAULT 15,
    meal_prep_duration INTEGER DEFAULT 45,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(profile)
);

-- Index for recurrence lookups
CREATE INDEX IF NOT EXISTS idx_fin_tasks_recurrence ON fin_tasks USING gin (recurrence_config);

-- 3. Enable RLS and add policies
ALTER TABLE fin_day_planner_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planner settings"
    ON fin_day_planner_settings FOR SELECT
    USING (auth.uid() = profile);

CREATE POLICY "Users can update their own planner settings"
    ON fin_day_planner_settings FOR UPDATE
    USING (auth.uid() = profile)
    WITH CHECK (auth.uid() = profile);

CREATE POLICY "Users can insert their own planner settings"
    ON fin_day_planner_settings FOR INSERT
    WITH CHECK (auth.uid() = profile);
