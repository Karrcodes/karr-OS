-- Migration to add pocket_id to fin_income table
ALTER TABLE fin_income ADD COLUMN pocket_id UUID REFERENCES fin_pockets(id);

-- Optional: Update existing records if needed (usually not possible if they were generic)
-- COMMENT: This allows income to be attributed to specific pockets.
