-- Migration to add priority column to fin_tasks
ALTER TABLE fin_tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'low';
ALTER TABLE fin_tasks ADD CONSTRAINT valid_priority CHECK (priority IN ('super', 'high', 'mid', 'low'));
