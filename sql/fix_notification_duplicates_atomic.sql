-- Atomic webhook processing
CREATE OR REPLACE FUNCTION process_monzo_transaction(
    p_provider_tx_id TEXT,
    p_description TEXT,
    p_amount NUMERIC,
    p_type TEXT,
    p_category TEXT,
    p_pocket_id UUID,
    p_profile TEXT,
    p_date TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- 1. Check if transaction already exists (idempotency)
    SELECT EXISTS (
        SELECT 1 FROM fin_transactions 
        WHERE provider_tx_id = p_provider_tx_id 
        AND provider = 'monzo'
    ) INTO v_exists;
    
    IF v_exists THEN
        RETURN FALSE; -- Already processed, do not notify again
    END IF;

    -- 2. Atomic insert
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
    
    -- If the insert happened (did not conflict), FOUND will be true.
    -- This ensures even if two requests pass the check simultaneously, only one succeeds the insert.
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic notification gating to prevent duplicate alerts in a short window
CREATE OR REPLACE FUNCTION log_and_gate_notification(
    p_title TEXT,
    p_body TEXT,
    p_url TEXT,
    p_cooldown_seconds INT DEFAULT 10
) RETURNS BOOLEAN AS $$
DECLARE
    v_recent_exists BOOLEAN;
BEGIN
    -- Check for identical notification in the last X seconds
    SELECT EXISTS (
        SELECT 1 FROM sys_notification_logs 
        WHERE title = p_title 
        AND body = p_body 
        AND created_at > NOW() - (p_cooldown_seconds || ' seconds')::INTERVAL
    ) INTO v_recent_exists;

    IF v_recent_exists THEN
        RETURN FALSE; -- Duplicate found in cooldown window, skip sending
    END IF;

    -- Log it immediately to block concurrent calls
    INSERT INTO sys_notification_logs (title, body, url) 
    VALUES (p_title, p_body, p_url);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
