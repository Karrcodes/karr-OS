-- Add category column to studio_networks

ALTER TABLE studio_networks ADD COLUMN IF NOT EXISTS category TEXT;

-- For existing static entries, we can provide some default categories if needed, but NULL is fine to start.

-- No changes to RLS policies are needed as they already apply to the table structure.
