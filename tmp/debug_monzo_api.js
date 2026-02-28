const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMonzo() {
    console.log('--- MONZO DEBUG START ---');

    // 1. Get Token
    const { data: secret, error: secretError } = await supabase
        .from('fin_secrets')
        .select('secret_data')
        .eq('user_id', 'karr')
        .eq('service', 'monzo')
        .single();

    if (secretError || !secret) {
        console.error('Failed to get secret:', secretError);
        return;
    }

    const token = secret.secret_data.access_token;
    const accountId = secret.secret_data.account_id;
    console.log('Account ID:', accountId);

    // 2. Fetch Recent Transactions
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();

    console.log(`Fetching transactions since: ${threeHoursAgo}`);

    const txRes = await fetch(`https://api.monzo.com/transactions?account_id=${accountId}&since=${threeHoursAgo}&expand[]=merchant`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!txRes.ok) {
        console.error('Fetch failed:', txRes.status, await txRes.text());
        return;
    }

    const txData = await txRes.json();
    console.log(`Found ${txData.transactions.length} transactions in the last 3 hours.`);

    txData.transactions.forEach(tx => {
        console.log(`[${tx.created}] £${Math.abs(tx.amount / 100)} - ${tx.merchant?.name || tx.description} (${tx.id})`);
    });

    console.log('--- MONZO DEBUG END ---');
}

debugMonzo();
