const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const envPath = path.resolve('c:/Users/Karr/Documents/Projects/karr-OS/.env.local');
require('dotenv').config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
    console.log('--- Applying Migration ---');

    // First, try to add the constraint. Wrap in try/catch because it might already exist or fail if duplicates exist.
    const { error: constraintError } = await supabase.rpc('exec_sql', {
        sql_string: `ALTER TABLE fin_transactions ADD CONSTRAINT fin_transactions_provider_tx_id_key UNIQUE (provider, provider_tx_id);`
    });

    if (constraintError) {
        console.warn('Constraint addition failed (it might already exist or duplicates need cleaning):', constraintError);
    } else {
        console.log('Unique constraint added successfully.');
    }

    // Now update the RPC
    const rpcSql = `
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
    SELECT EXISTS (
        SELECT 1 FROM fin_transactions 
        WHERE provider_tx_id = p_provider_tx_id 
        AND provider = 'monzo'
    ) INTO v_exists;
    
    IF v_exists THEN
        RETURN 'EXISTS';
    END IF;

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
    `;

    const { error: rpcUpdateStatus } = await supabase.rpc('exec_sql', {
        sql_string: rpcSql
    });

    if (rpcUpdateStatus) {
        console.error('RPC update failed:', rpcUpdateStatus);
    } else {
        console.log('RPC updated successfully.');
    }
}

// NOTE: If exec_sql doesn't exist, this will fail. I'll need to check if I have a way to run raw SQL.
// Usually, I can't run raw SQL via rpc unless I defined exec_sql.
// If not, I'll have to ask the user to run the .sql file in Supabase dashboard.

migrate();
