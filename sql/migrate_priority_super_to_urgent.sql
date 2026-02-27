-- Migration to rename 'super' priority to 'urgent' and update its check constraint
-- Created to fix: Error 23514: check constraint "valid_priority" violates priority rename

-- 1. Drop the old constraint that blocks 'urgent'
ALTER TABLE fin_tasks DROP CONSTRAINT IF EXISTS valid_priority;

-- 2. Update the data in both tasks and goals
UPDATE fin_tasks SET priority = 'urgent' WHERE priority = 'super';
UPDATE sys_goals SET priority = 'urgent' WHERE priority = 'super';

-- 3. Add the new constraint with 'urgent' included
ALTER TABLE fin_tasks ADD CONSTRAINT valid_priority CHECK (priority IN ('urgent', 'high', 'mid', 'low'));
