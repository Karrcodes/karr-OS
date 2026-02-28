import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debug() {
    console.log('--- DEBUG: NOTIFICATION STATE ---')

    // 1. Check subscriptions
    const { data: subs } = await supabase.from('sys_push_subscriptions').select('*').eq('user_id', 'karr')
    console.log(`Active subscriptions for 'karr': ${subs?.length || 0}`)
    if (subs) console.log(JSON.stringify(subs, null, 2))

    // 2. Check recent notification logs
    const { data: logs } = await supabase
        .from('sys_notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
    console.log('\n--- Recent Notification Logs ---')
    console.log(JSON.stringify(logs, null, 2))

    // 3. Check recent transactions
    const { data: txs } = await supabase
        .from('fin_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
    console.log('\n--- Recent Transactions ---')
    console.log(JSON.stringify(txs, null, 2))
}

debug()
