/**
 * Check Supabase RLS: Do client-side queries see all transactions?
 * This uses the anon key (same as the browser would use) to query
 * Run: node tmp/check_rls.js
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Use ANON key to simulate what the browser sees
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function run() {
    // Query as anon (unauthenticated) - will show RLS effect
    const { data, error } = await supabase
        .from('fin_transactions')
        .select('id, description, amount, type, profile, date')
        .order('date', { ascending: false })
        .limit(20)

    if (error) {
        console.log('Error (RLS blocking??):', error.message)
        return
    }

    console.log(`Client-side query returned: ${data?.length ?? 0} transactions`)
    data?.forEach(t => {
        const time = new Date(t.date).toLocaleString('en-GB')
        console.log(`  [${time}] £${t.amount} | ${t.type} | ${t.description} | profile: ${t.profile}`)
    })
}

run().catch(console.error)
