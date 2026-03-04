-- Migration: Sync fin_tasks table with all required fields for Studio Linking and Operations
-- Allows for granular filtering and linkage between Operations and Studio modules.

ALTER TABLE fin_tasks 
ADD COLUMN IF NOT EXISTS strategic_category TEXT,
ADD COLUMN IF NOT EXISTS amount TEXT,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS due_date_mode TEXT,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recurrence_config JSONB,
ADD COLUMN IF NOT EXISTS position NUMERIC,
ADD COLUMN IF NOT EXISTS notes JSONB,
ADD COLUMN IF NOT EXISTS ai_position_x FLOAT8,
ADD COLUMN IF NOT EXISTS ai_position_y FLOAT8,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS impact_score INTEGER,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES studio_projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES studio_content(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS travel_to_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS travel_from_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_time TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS origin_location TEXT;

-- Index for faster filtering and relationship lookups
CREATE INDEX IF NOT EXISTS idx_fin_tasks_project_id ON fin_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_fin_tasks_content_id ON fin_tasks(content_id);
CREATE INDEX IF NOT EXISTS idx_fin_tasks_strategic_category ON fin_tasks(strategic_category);
