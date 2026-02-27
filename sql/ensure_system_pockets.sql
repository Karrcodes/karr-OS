-- Ensure system-critical pockets exist
DO $$ 
BEGIN
    -- Personal Profile
    IF NOT EXISTS (SELECT 1 FROM fin_pockets WHERE name ILIKE '%General%' AND profile = 'personal') THEN
        INSERT INTO fin_pockets (name, type, balance, current_balance, target_budget, sort_order, profile)
        VALUES ('General', 'general', 0, 0, 0, 0, 'personal');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM fin_pockets WHERE name ILIKE '%Liabilities%' AND profile = 'personal') THEN
        INSERT INTO fin_pockets (name, type, balance, current_balance, target_budget, sort_order, profile)
        VALUES ('Liabilities', 'buffer', 0, 0, 0, 99, 'personal');
    END IF;

    -- Business Profile
    IF NOT EXISTS (SELECT 1 FROM fin_pockets WHERE name ILIKE '%General%' AND profile = 'business') THEN
        INSERT INTO fin_pockets (name, type, balance, current_balance, target_budget, sort_order, profile)
        VALUES ('General', 'general', 0, 0, 0, 0, 'business');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM fin_pockets WHERE name ILIKE '%Liabilities%' AND profile = 'business') THEN
        INSERT INTO fin_pockets (name, type, balance, current_balance, target_budget, sort_order, profile)
        VALUES ('Liabilities', 'buffer', 0, 0, 0, 99, 'business');
    END IF;
END $$;
