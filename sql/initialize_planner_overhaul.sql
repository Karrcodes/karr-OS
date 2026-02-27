-- 1. Add algorithmic parameters to fin_tasks
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER; -- In minutes
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS time_bound BOOLEAN DEFAULT false;
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS deadline_type TEXT CHECK (deadline_type IN ('hard', 'soft'));
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'task' CHECK (recurrence_type IN ('habit', 'task'));
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS energy_requirement TEXT CHECK (energy_requirement IN ('high', 'medium', 'low'));
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 1;
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS project_id UUID; -- Foreign key/Reference to future Create module
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS travel_duration INTEGER DEFAULT 0; -- In minutes

-- 2. Create Planner Initializations table
-- Tracks the T-Zero moment for each day
CREATE TABLE IF NOT EXISTS fin_planner_initializations (
    date DATE PRIMARY KEY,
    t_zero TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for fin_planner_initializations
ALTER TABLE fin_planner_initializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for anon" ON fin_planner_initializations FOR ALL USING (true);

-- 3. Extend Day Planner Settings
ALTER TABLE fin_day_planner_settings ADD COLUMN IF NOT EXISTS roster_config JSONB DEFAULT '{
    "type": "3-on-3-off",
    "anchor_date": "2026-02-23",
    "shift_start": "06:00",
    "shift_end": "18:00"
}'::jsonb;

ALTER TABLE fin_day_planner_settings ADD COLUMN IF NOT EXISTS routine_defaults JSONB DEFAULT '{
    "gym": {"duration": 90, "preferred_window": ["06:00", "10:00"]},
    "walk": {"duration": 30, "auto_inject": true},
    "meal_prep": {"duration": 45, "required": true}
}'::jsonb;

ALTER TABLE fin_day_planner_settings ADD COLUMN IF NOT EXISTS evening_constraints JSONB DEFAULT '{
    "allowed_categories": ["admin", "learning", "content_planning"],
    "max_duration_minutes": 120
}'::jsonb;

ALTER TABLE fin_day_planner_settings ADD COLUMN IF NOT EXISTS chill_mode_active BOOLEAN DEFAULT false;
