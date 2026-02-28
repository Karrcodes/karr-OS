require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const todayStart = new Date()
todayStart.setUTCHours(0, 0, 0, 0)

sb.from('fin_transactions')
    .select('amount, description, category, type, date')
    .eq('profile', 'personal')
    .gte('date', todayStart.toISOString())
    .order('date', { ascending: true })
    .then(({ data, error }) => {
        if (error) { console.log(error); return }
        console.log(`Today's transactions (${data?.length ?? 0}):`)
        data?.forEach(t => {
            const time = new Date(t.date).toLocaleTimeString('en-GB')
            console.log(`  [${time}] ${t.type}/${t.category} | £${t.amount} | ${t.description}`)
        })
    })
