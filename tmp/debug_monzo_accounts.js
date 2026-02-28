const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugMonzoAccounts() {
    console.log('--- MONZO ACCOUNT DEBUG START ---');

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
    console.log('Token exists, fetching accounts...');

    // 2. Fetch Accounts
    const accRes = await fetch('https://api.monzo.com/accounts', {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!accRes.ok) {
        console.error('Account fetch failed:', accRes.status, await accRes.text());
        return;
    }

    const accData = await accRes.json();
    console.log(`Found ${accData.accounts.length} accounts.`);
    accData.accounts.forEach(acc => {
        console.log(`- ${acc.description} (${acc.type}): ${acc.id} [Closed: ${acc.closed}]`);
    });

    console.log('--- MONZO ACCOUNT DEBUG END ---');
}

debugMonzoAccounts();
