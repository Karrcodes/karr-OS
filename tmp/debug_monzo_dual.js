const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMonzoBoth() {
    console.log('--- MONZO DUAL-ACCOUNT DEBUG START ---');

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

    const accounts = [
        { id: 'acc_0000AjgxPvMofucaiSz62L', name: 'Personal' },
        { id: 'acc_0000B3kfX8uKdNsJYNMVso', name: 'Business' }
    ];

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    for (const acc of accounts) {
        console.log(`\nChecking transactions for ${acc.name} (${acc.id}) since ${threeHoursAgo}...`);

        try {
            const txRes = await fetch(`https://api.monzo.com/transactions?account_id=${acc.id}&since=${threeHoursAgo}&expand[]=merchant`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!txRes.ok) {
                console.error(`- Fetch failed for ${acc.name}:`, txRes.status, await txRes.text());
                continue;
            }

            const txData = await txRes.json();
            console.log(`- Found ${txData.transactions.length} transactions.`);

            txData.transactions.forEach(tx => {
                console.log(`  [${tx.created}] £${Math.abs(tx.amount / 100)} - ${tx.merchant?.name || tx.description} (${tx.id})`);
            });
        } catch (err) {
            console.error(`- Error checking ${acc.name}:`, err.message);
        }
    }

    console.log('\n--- MONZO DUAL-ACCOUNT DEBUG END ---');
}

debugMonzoBoth();
