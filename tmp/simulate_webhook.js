const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const envPath = path.resolve('c:/Users/Karr/Documents/Projects/karr-OS/.env.local');
require('dotenv').config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simulate() {
    console.log('--- Simulating Webhook POST ---');
    // Simulate the data structure we handle in route.ts
    const body = {
        type: 'transaction.updated',
        data: {
            id: 'tx_DEBUG_REPLAY_' + Date.now(),
            created: new Date().toISOString(),
            amount: -1234, // £12.34
            currency: 'GBP',
            description: 'Simulated Replay Test',
            category: 'eating_out',
            account_id: 'acc_00009237hCw9Z5ycuA3s6Q', // Need a valid account_id or pot_id from DB
            metadata: {}
        }
    };

    // Need to find a valid monzo_id from fin_pockets to make it realistic
    const { data: pockets } = await supabase.from('fin_pockets').select('monzo_id, name').limit(1);
    if (pockets && pockets.length > 0) {
        body.data.account_id = pockets[0].monzo_id;
        console.log(`Using valid Monzo ID from pocket: ${pockets[0].name} (${pockets[0].monzo_id})`);
    }

    try {
        const response = await fetch('http://localhost:3000/api/finance/monzo/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await response.json();
        console.log('Webhook Response:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Simulation Failed (is local server running?):', err.message);
        // If local fetch fails, try calling the logic via Supabase directly as if we were the webhook
        console.log('Attempting DIRECT RPC test instead...');
        const amount = Math.abs(body.data.amount / 100);
        const { data: rpcStatus, error: rpcError } = await supabase.rpc('process_monzo_transaction', {
            p_provider_tx_id: body.data.id,
            p_description: body.data.description,
            p_amount: amount,
            p_type: 'spend',
            p_category: body.data.category,
            p_pocket_id: null, // Test with null pocket
            p_profile: 'personal',
            p_date: body.data.created
        });
        console.log('RPC Direct Result:', rpcStatus, rpcError);
    }
}

simulate();
