const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debug() {
    console.log('--- LATEST LOGS (> 08:46:00) ---')

    // 1. Check for hits after the 08:46 hit
    const { data: logs } = await supabase
        .from('sys_notification_logs')
        .select('*')
        .gt('created_at', '2026-02-28T08:46:00Z')
        .order('created_at', { ascending: false })

    console.log('\n--- Logs ---')
    console.log(JSON.stringify(logs, null, 2))

    // 2. Check for transactions after 08:46
    const { data: txs } = await supabase
        .from('fin_transactions')
        .select('*')
        .gt('created_at', '2026-02-28T08:46:00Z')
        .order('created_at', { ascending: false })

    console.log('\n--- Transactions ---')
    console.log(JSON.stringify(txs, null, 2))
}

debug().catch(console.error)
