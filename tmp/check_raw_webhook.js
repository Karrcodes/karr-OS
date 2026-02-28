require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Get first few webhook hits and show raw body to understand format
sb.from('sys_notification_logs')
    .select('title,body,created_at')
    .eq('title', 'DEBUG: Webhook Hit')
    .gte('created_at', '2026-02-28T01:00:00Z')
    .lte('created_at', '2026-02-28T01:35:00Z')
    .order('created_at', { ascending: true })
    .limit(5)
    .then(({ data, error }) => {
        if (error) { console.log('Error:', error.message); return }
        console.log(`Webhook hits around rent time: ${data?.length ?? 0}\n`)
        data?.forEach(l => {
            const t = new Date(l.created_at).toLocaleTimeString('en-GB')
            console.log(`[${t}] Type of body: ${typeof l.body}`)
            console.log(`Raw body:`, JSON.stringify(l.body).slice(0, 300))
            console.log()
        })
    })
