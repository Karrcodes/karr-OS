-- Migration: Add strategic_category to fin_tasks
-- Allows for granular filtering by Finance, Career, Health, or Personal tags.

ALTER TABLE fin_tasks 
ADD COLUMN IF NOT EXISTS strategic_category TEXT;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_fin_tasks_strategic_category ON fin_tasks(strategic_category);
