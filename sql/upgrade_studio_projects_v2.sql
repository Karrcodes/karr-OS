-- Upgrade Studio Projects to support Matrix and Timeline views
ALTER TABLE studio_projects 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'mid',
ADD COLUMN IF NOT EXISTS strategic_category TEXT DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS ai_position_x NUMERIC,
ADD COLUMN IF NOT EXISTS ai_position_y NUMERIC;

-- Update existing records to have a default strategic category if none exists
UPDATE studio_projects SET strategic_category = 'personal' WHERE strategic_category IS NULL;
UPDATE studio_projects SET priority = 'mid' WHERE priority IS NULL;

-- Index for Matrix/Timeline performance
CREATE INDEX IF NOT EXISTS idx_studio_projects_priority ON studio_projects(priority);
CREATE INDEX IF NOT EXISTS idx_studio_projects_strat_cat ON studio_projects(strategic_category);
