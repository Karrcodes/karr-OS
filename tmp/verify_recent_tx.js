const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
// Using native fetch in Node 18+

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('--- REFRESH & FETCH START ---');

    // 1. Get token from DB
    const { data: secret } = await supabase
        .from('fin_secrets')
        .select('*')
        .eq('user_id', 'karr')
        .eq('service', 'monzo')
        .single();

    if (!secret) {
        console.error('No secret found');
        return;
    }

    const token = secret.secret_data;
    console.log(`Current Token Expired at: ${new Date(token.expires_at * 1000).toISOString()}`);

    // 2. Refresh
    console.log('Refreshing token...');
    const refreshRes = await fetch('https://api.monzo.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: process.env.NEXT_PUBLIC_MONZO_CLIENT_ID,
            client_secret: process.env.MONZO_CLIENT_SECRET,
            refresh_token: token.refresh_token
        })
    });

    if (!refreshRes.ok) {
        console.error('Refresh failed:', refreshRes.status, await refreshRes.text());
        return;
    }

    const newData = await refreshRes.json();
    const newExpiresAt = Math.floor(Date.now() / 1000) + newData.expires_in;

    // 3. Save back
    await supabase.from('fin_secrets').update({
        secret_data: {
            ...token,
            access_token: newData.access_token,
            refresh_token: newData.refresh_token,
            expires_at: newExpiresAt
        }
    }).eq('user_id', 'karr').eq('service', 'monzo');

    console.log('Token refreshed and saved.');

    // 4. Fetch accounts
    const accRes = await fetch('https://api.monzo.com/accounts', {
        headers: { Authorization: `Bearer ${newData.access_token}` }
    });
    const accData = await accRes.json();
    const personal = accData.accounts.find(a => a.type === 'uk_retail');
    const business = accData.accounts.find(a => a.type === 'uk_business');

    // 5. Fetch transactions for both (last hour)
    const since = new Date(Date.now() - 3600 * 1000).toISOString();

    async function getTx(acc, label) {
        if (!acc) return;
        console.log(`\nTransactions for ${label} (${acc.id}) since ${since}:`);
        const txRes = await fetch(`https://api.monzo.com/transactions?account_id=${acc.id}&since=${since}&expand[]=merchant`, {
            headers: { Authorization: `Bearer ${newData.access_token}` }
        });
        const txData = await txRes.json();
        if (txData.transactions?.length === 0) {
            console.log('  None found.');
        } else {
            txData.transactions.forEach(t => {
                console.log(`  - [${t.created}] ${t.amount / 100} ${t.currency}: ${t.merchant?.name || t.description} (ID: ${t.id})`);
            });
        }
    }

    await getTx(personal, 'Personal');
    await getTx(business, 'Business');

    console.log('\n--- REFRESH & FETCH END ---');
}

run().catch(console.error);
