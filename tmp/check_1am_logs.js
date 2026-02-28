require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

sb.from('sys_notification_logs')
    .select('title,body,created_at')
    .gte('created_at', '2026-02-28T01:00:00Z')
    .lte('created_at', '2026-02-28T02:30:00Z')
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
        if (error) { console.log('Error:', error.message); return }
        console.log('Logs between 01:00-02:30 UTC:', data?.length ?? 0)
        data?.forEach(l => {
            const t = new Date(l.created_at).toLocaleTimeString('en-GB')
            console.log(`[${t}] ${l.title} - ${String(l.body || '').slice(0, 150)}`)
        })
    })
