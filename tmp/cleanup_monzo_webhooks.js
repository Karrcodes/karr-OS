const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupWebhooks() {
    console.log('--- MONZO WEBHOOK CLEANUP START ---');

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

    const targetUrl = 'https://karr-os.vercel.app/api/finance/monzo/webhook';

    for (const acc of accounts) {
        console.log(`\nProcessing ${acc.name} (${acc.id})...`);

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

            let hasTarget = false;
            for (const hook of hookData.webhooks) {
                if (hook.url === targetUrl && !hasTarget) {
                    console.log(`  - Keeping active webhook: ${hook.id}`);
                    hasTarget = true;
                } else {
                    console.log(`  - Deleting redundant/invalid webhook: ${hook.url} (${hook.id})`);
                    await fetch(`https://api.monzo.com/webhooks/${hook.id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            }

            if (!hasTarget) {
                console.log(`  - Re-registering missing webhook for ${acc.name}...`);
                const regRes = await fetch('https://api.monzo.com/webhooks', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        account_id: acc.id,
                        url: targetUrl
                    })
                });
                if (regRes.ok) console.log('    - Success');
                else console.error('    - Failed:', await regRes.text());
            }
        } catch (err) {
            console.error(`- Error processing ${acc.name}:`, err.message);
        }
    }

    console.log('\n--- MONZO WEBHOOK CLEANUP END ---');
}

cleanupWebhooks();
