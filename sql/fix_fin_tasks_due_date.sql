-- Fix: Add due_date to the correct table (fin_tasks)
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS due_date DATE;

-- Index for performance in calendar views
CREATE INDEX IF NOT EXISTS idx_fin_tasks_due_date ON fin_tasks(due_date);
