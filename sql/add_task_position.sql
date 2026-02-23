-- Add position column to fin_tasks for manual reordering
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS position DOUBLE PRECISION;

-- Initialize position based on created_at to preserve existing order
-- We use EXTRACT(EPOCH FROM created_at) to get a numeric value
UPDATE fin_tasks SET position = EXTRACT(EPOCH FROM created_at) WHERE position IS NULL;

-- Index for ordering performance
CREATE INDEX IF NOT EXISTS idx_fin_tasks_position ON fin_tasks (position);
