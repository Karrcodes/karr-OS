-- Migration to add target_amount to fin_pockets for proper savings goal separation
ALTER TABLE fin_pockets ADD COLUMN IF NOT EXISTS target_amount DECIMAL(12,2) DEFAULT 0;
COMMENT ON COLUMN fin_pockets.target_amount IS 'Monzo goal amount (actual savings target)';

-- Initialize target_amount from target_budget where type is savings (cleanup)
UPDATE fin_pockets SET target_amount = target_budget WHERE type = 'savings' AND target_amount = 0;
