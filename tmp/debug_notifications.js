const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const targetMonzoId = 'tx_0000B3m60eoNt2eN3yqLbt';

async function debug() {
    console.log(`--- DEEP DEBUG: Monzo ID ${targetMonzoId} ---`)

    // 1. Check if it exists in fin_transactions
    const { data: txs } = await supabase
        .from('fin_transactions')
        .select('*')
        .eq('provider_tx_id', targetMonzoId)

    console.log('\n--- Transaction Record ---')
    console.log(JSON.stringify(txs, null, 2))

    // 2. Check all logs related to this ID
    const { data: logs } = await supabase
        .from('sys_notification_logs')
        .select('*')
        .ilike('body', `%${targetMonzoId}%`)
        .order('created_at', { ascending: true })

    console.log('\n--- Related Logs ---')
    console.log(JSON.stringify(logs, null, 2))

    // 3. Check for any other recent Monzo transactions
    const { data: recentMonzo } = await supabase
        .from('fin_transactions')
        .select('*')
        .eq('provider', 'monzo')
        .order('created_at', { ascending: false })
        .limit(3)

    console.log('\n--- Most Recent Monzo Transactions ---')
    console.log(JSON.stringify(recentMonzo, null, 2))
}

debug().catch(console.error)
