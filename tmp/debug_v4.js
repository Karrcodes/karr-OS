const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const envPath = path.resolve('c:/Users/Karr/Documents/Projects/karr-OS/.env.local');
require('dotenv').config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
    console.log('--- Latest Notification Activity ---');
    const { data: logs } = await supabase
        .from('sys_notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

    // Split into heartbeats and results
    const results = logs.filter(l => l.title.includes('SUCCESS') || l.title.includes('ERROR') || l.title.includes('FATAL'));
    const heartbeats = logs.filter(l => l.title === 'DEBUG: Webhook Hit');

    console.log('\n--- Status Results ---');
    console.log(JSON.stringify(results, null, 2));

    console.log('\n--- Recent Webhook Hits ---');
    console.log(JSON.stringify(heartbeats.slice(0, 5), null, 2));

    console.log('\n--- Active Push Subscriptions ---');
    const { data: subs } = await supabase
        .from('sys_push_subscriptions')
        .select('*')
        .eq('user_id', 'karr');
    console.log(JSON.stringify(subs, null, 2));
}

debug();
