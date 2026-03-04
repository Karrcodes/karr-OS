-- Migration to update Spark statuses to new lifecycle
-- New statuses: 'inbox', 'review', 'utilized', 'discarded'
-- Mapping: 'active' -> 'inbox', 'acquired' -> 'utilized', 'dismissed' -> 'discarded'

UPDATE studio_sparks SET status = 'inbox' WHERE status = 'active';
UPDATE studio_sparks SET status = 'utilized' WHERE status = 'acquired';
UPDATE studio_sparks SET status = 'discarded' WHERE status = 'dismissed';

-- Ensure future inserts default to 'inbox'
ALTER TABLE studio_sparks ALTER COLUMN status SET DEFAULT 'inbox';
