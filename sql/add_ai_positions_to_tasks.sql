-- Add AI-Plotter position columns to fin_tasks for Focus Map persistence
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS ai_position_x DOUBLE PRECISION;
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS ai_position_y DOUBLE PRECISION;

-- Add comment for documentation
COMMENT ON COLUMN fin_tasks.ai_position_x IS 'Horizontal percentage position (16-84) on the Focus Map grid';
COMMENT ON COLUMN fin_tasks.ai_position_y IS 'Vertical percentage position (15-85) on the Focus Map grid';
