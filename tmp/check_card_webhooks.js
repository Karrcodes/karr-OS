require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Check ALL webhook hits today - look for any card payment transaction types
sb.from('sys_notification_logs')
    .select('title,body,created_at')
    .eq('title', 'DEBUG: Webhook Hit')
    .gte('created_at', '2026-02-28T00:00:00Z')
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
        if (error) { console.log('Error:', error.message); return }
        console.log(`Total webhook hits today: ${data?.length ?? 0}\n`)

        const summary = {}
        for (const log of (data || [])) {
            try {
                const body = JSON.parse(log.body)
                const type = body.type
                const category = body.data?.category || 'unknown'
                const merchant = body.data?.merchant?.name || body.data?.description || 'no-merchant'
                const amount = body.data?.amount
                const time = new Date(log.created_at).toLocaleTimeString('en-GB')

                // Only show non-transfer, non-pot transactions
                const isCard = !merchant.startsWith('pot_') && category !== 'transfers' && category !== 'p2p'
                if (isCard) {
                    console.log(`[${time}] ${type} | ${category} | £${(amount / 100).toFixed(2)} | ${merchant}`)
                }

                const key = `${type}:${category}`
                summary[key] = (summary[key] || 0) + 1
            } catch { }
        }

        console.log('\n=== Summary by type:category ===')
        Object.entries(summary)
            .sort((a, b) => b[1] - a[1])
            .forEach(([k, v]) => console.log(`  ${k}: ${v} hits`))
    })
