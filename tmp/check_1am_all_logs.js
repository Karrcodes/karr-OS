require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Get ALL log entries around 1:31am (not just webhook hits)
sb.from('sys_notification_logs')
    .select('title,body,created_at')
    .gte('created_at', '2026-02-28T01:28:00Z')
    .lte('created_at', '2026-02-28T01:35:00Z')
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
        if (error) { console.log('Error:', error.message); return }
        console.log(`All logs 01:28-01:35 UTC: ${data?.length ?? 0}\n`)
        data?.forEach(l => {
            const t = new Date(l.created_at).toLocaleTimeString('en-GB')
            console.log(`[${t}] TITLE: ${l.title}`)
            console.log(`  BODY: ${String(l.body || '').slice(0, 200)}`)
            console.log()
        })
    })
