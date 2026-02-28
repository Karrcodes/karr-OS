const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const envPath = path.resolve('c:/Users/Karr/Documents/Projects/karr-OS/.env.local');
require('dotenv').config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspect() {
    console.log('--- Inspecting fin_transactions columns ---');
    // Using a trick: try to insert an empty object to trigger a schema error or check health
    // Actually, I can just query information_schema if I have a postgres connection
    // But since I don't have psql, I'll try to select one row and see the keys
    const { data } = await supabase.from('fin_transactions').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('No data found to inspect columns.');
    }
}

inspect();
