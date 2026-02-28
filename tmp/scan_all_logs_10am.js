require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Scan ALL webhook logs between 10:30am and 12:10pm for ANY non-transfer webhook hits
// This will tell us definitively if Monzo sent card payment webhooks but they were dropped/ignored
sb.from('sys_notification_logs')
    .select('title,body,created_at')
    .gte('created_at', '2026-02-28T10:30:00Z')
    .lte('created_at', '2026-02-28T12:10:00Z')
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
        if (error) { console.log('Error:', error.message); return }

        const grouped = {}
        for (const log of (data || [])) {
            const minute = new Date(log.created_at).toISOString().slice(0, 16)
            if (!grouped[minute]) grouped[minute] = []
            grouped[minute].push(log.title)
        }

        console.log(`Total logs 10:30-12:10 UTC: ${data?.length}\n`)
        console.log('Activity by minute:')
        for (const [min, titles] of Object.entries(grouped)) {
            const counts = {}
            titles.forEach(t => counts[t] = (counts[t] || 0) + 1)
            const summary = Object.entries(counts).map(([t, c]) => `${t}(${c})`).join(', ')
            console.log(`  ${min}: ${summary}`)
        }

        // Find any non-transfer webhook hits
        const cardHits = (data || []).filter(l => {
            if (l.title !== 'DEBUG: Webhook Hit') return false
            const body = l.body || ''
            return !body.includes('pot_') && (
                body.includes('groceries') ||
                body.includes('eating_out') ||
                body.includes('shopping') ||
                body.includes('general') ||
                body.includes('entertainment') ||
                body.includes('1.84') ||
                body.includes('0.30') ||
                body.includes('0.65') ||
                body.includes('Tesco') ||
                body.includes('Karrtesian') ||
                body.includes('ShareTheMeal') ||
                body.includes('Share')
            )
        })

        console.log(`\nCard payment webhook hits: ${cardHits.length}`)
        cardHits.forEach(l => {
            const t = new Date(l.created_at).toLocaleTimeString('en-GB')
            console.log(`  [${t}] ${l.body?.slice(0, 200)}`)
        })
    })
