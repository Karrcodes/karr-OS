const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const envPath = path.resolve('c:/Users/Karr/Documents/Projects/karr-OS/.env.local');
require('dotenv').config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    console.log('--- Checking Transaction tx_0000B3m8wswVhna4yCCTdy ---');
    const { data: tx } = await supabase
        .from('fin_transactions')
        .select('*')
        .eq('provider_tx_id', 'tx_0000B3m8wswVhna4yCCTdy')
        .single();

    console.log(JSON.stringify(tx, null, 2));

    console.log('\n--- Checking Settings ---');
    const { data: settings } = await supabase
        .from('sys_settings')
        .select('*')
        .eq('key', 'notification_transactions');
    console.log(JSON.stringify(settings, null, 2));
}

check();
