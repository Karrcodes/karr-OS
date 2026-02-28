/**
 * Check what transactions are in the DB
 * Run: node tmp/check_db_tx.js
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
    // 1. All monzo transactions in DB, sorted by date
    const { data: txs, error } = await supabase
        .from('fin_transactions')
        .select('id, provider_tx_id, description, amount, type, category, pocket_id, profile, date, provider')
        .eq('provider', 'monzo')
        .order('date', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log(`Total Monzo transactions in DB: ${txs.length}\n`)
    for (const tx of txs) {
        const time = new Date(tx.date).toLocaleString('en-GB')
        console.log(`[${time}] £${tx.amount} | ${tx.type} | ${tx.category} | ${tx.description} | profile: ${tx.profile}`)
    }

    // 2. Check if specific Tesco or merchant transactions are there
    console.log('\n--- Searching for non-transfer transactions ---')
    const merchants = txs.filter(t => t.type !== 'transfer' && !t.description?.startsWith('pot_') && !t.description?.includes('Transfer'))
    console.log(`Non-transfer transactions: ${merchants.length}`)
    for (const tx of merchants) {
        const time = new Date(tx.date).toLocaleString('en-GB')
        console.log(` [${time}] £${tx.amount} | ${tx.type} | ${tx.description}`)
    }
}

run().catch(console.error)
