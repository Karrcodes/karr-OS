const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const envPath = path.resolve('c:/Users/Karr/Documents/Projects/karr-OS/.env.local');
require('dotenv').config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function directRpc() {
    console.log('--- Direct RPC Test ---');
    const testId = 'tx_MANUAL_TEST_' + Date.now();
    const { data: rpcStatus, error: rpcError } = await supabase.rpc('process_monzo_transaction', {
        p_provider_tx_id: testId,
        p_description: 'Manual RPC Test Notification',
        p_amount: 1.23,
        p_type: 'spend',
        p_category: 'shopping',
        p_pocket_id: null,
        p_profile: 'personal',
        p_date: new Date().toISOString()
    });

    console.log('RPC Status:', rpcStatus);
    if (rpcError) console.error('RPC Error:', rpcError);

    // If inserted, check if notifyMonzoTransaction would work
    if (rpcStatus === 'INSERTED') {
        console.log('Success! RPC allowed insertion.');
    }
}

directRpc();
