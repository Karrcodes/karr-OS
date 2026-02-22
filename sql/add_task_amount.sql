-- Add amount column to fin_tasks for grocery quantities
ALTER TABLE fin_tasks ADD COLUMN IF NOT EXISTS amount TEXT;
