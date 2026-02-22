-- Add due_date to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;

-- Index for performance in calendar views
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
