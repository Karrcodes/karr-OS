-- Add unique constraint to enable ON CONFLICT logic
ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_provider_tx_id_key UNIQUE (provider, provider_tx_id);

-- Update the RPC to be even more robust
CREATE OR REPLACE FUNCTION process_monzo_transaction(
    p_provider_tx_id TEXT,
    p_description TEXT,
    p_amount NUMERIC,
    p_type TEXT,
    p_category TEXT,
    p_pocket_id UUID,
    p_profile TEXT,
    p_date TIMESTAMPTZ
) RETURNS TEXT AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- 1. Explicit check first (fast path)
    SELECT EXISTS (
        SELECT 1 FROM fin_transactions 
        WHERE provider_tx_id = p_provider_tx_id 
        AND provider = 'monzo'
    ) INTO v_exists;
    
    IF v_exists THEN
        RETURN 'EXISTS';
    END IF;

    -- 2. Atomic insert with ON CONFLICT support
    INSERT INTO fin_transactions (
        provider_tx_id, 
        description, 
        amount, 
        type, 
        category, 
        pocket_id, 
        profile, 
        date, 
        provider
    ) VALUES (
        p_provider_tx_id, 
        p_description, 
        p_amount, 
        p_type, 
        p_category, 
        p_pocket_id, 
        p_profile, 
        p_date, 
        'monzo'
    ) ON CONFLICT (provider, provider_tx_id) DO NOTHING;
    
    IF FOUND THEN
        RETURN 'INSERTED';
    ELSE
        RETURN 'CONFLICT';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
