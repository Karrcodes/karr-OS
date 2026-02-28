const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMonzoWebhooks() {
    console.log('--- MONZO WEBHOOK DEBUG START ---');

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

    for (const acc of accounts) {
        console.log(`\nChecking webhooks for ${acc.name} (${acc.id})...`);

        try {
            const hookRes = await fetch(`https://api.monzo.com/webhooks?account_id=${acc.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!hookRes.ok) {
                console.error(`- Fetch failed for ${acc.name}:`, hookRes.status, await hookRes.text());
                continue;
            }

            const hookData = await hookRes.json();
            console.log(`- Found ${hookData.webhooks.length} webhooks.`);

            hookData.webhooks.forEach(hook => {
                console.log(`  - ${hook.url} (ID: ${hook.id})`);
            });
        } catch (err) {
            console.error(`- Error checking ${acc.name}:`, err.message);
        }
    }

    console.log('\n--- MONZO WEBHOOK DEBUG END ---');
}

debugMonzoWebhooks();
