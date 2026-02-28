/**
 * Check recent webhook notifications for today's transactions
 * Run: node tmp/check_webhook_logs.js
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
    // Check notification logs for webhook hits around 10:42-10:50
    const since = new Date('2026-02-28T10:30:00Z').toISOString()

    const { data, error } = await supabase
        .from('sys_notification_logs')
        .select('title, body, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error:', error.message)
        return
    }

    console.log(`Webhook log entries since 10:30 UTC: ${data?.length ?? 0}\n`)
    for (const log of (data || [])) {
        const time = new Date(log.created_at).toLocaleTimeString('en-GB')
        console.log(`[${time}] ${log.title}`)
        if (log.body) console.log(`  ${log.body.slice(0, 200)}`)
        console.log()
    }
}

run().catch(console.error)
