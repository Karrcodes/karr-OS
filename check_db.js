import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    console.log("Checking fin_pockets...")
    const { error: pe } = await supabase.from('fin_pockets').insert({ name: 'test', target_budget: 0, current_balance: 0, balance: 0, type: 'general' })
    console.log('fin_pockets insert error:', pe?.message || 'Success')

    console.log("Checking fin_income...")
    const { error: ie } = await supabase.from('fin_income').select('*').limit(1)
    console.log('fin_income select error:', ie?.message || 'Success')

    console.log("Checking fin_transactions columns...")
    const { data: t, error: te } = await supabase.from('fin_transactions').select('*').limit(1)
    console.log('fin_transactions select error:', te?.message || 'Success')
    if (t && t.length > 0) {
        console.log('fin_transactions sample row:', Object.keys(t[0]))
    } else {
        // no rows, let's insert a dummy and delete to get the schema error if any
        const { error: insertErr } = await supabase.from('fin_transactions').insert({ type: 'x', amount: 0, date: '2020-01-01' })
        console.log('fin_transactions insert error (schema hints):', insertErr?.message)
    }

    // Cleanup test pocket
    await supabase.from('fin_pockets').delete().eq('name', 'test')
}

run()
