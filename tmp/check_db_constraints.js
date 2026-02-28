/**
 * Check fin_transactions table constraints and look for any silent failures
 * for card payment transactions specifically.
 * Run: node tmp/check_db_constraints.js
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
    // 1. Try inserting a fake card transaction directly to see if DB accepts it
    console.log('=== 1. Test direct insert of card payment transaction ===')
    const testId = `tx_DBTEST_${Date.now()}`
    const { data: rpcResult, error: rpcError } = await supabase.rpc('process_monzo_transaction', {
        p_provider_tx_id: testId,
        p_description: 'Tesco Express',
        p_amount: 1.84,
        p_type: 'spend',
        p_category: 'groceries',
        p_pocket_id: null,  // No pocket (what happens when pocket lookup fails for card payments)
        p_profile: 'personal',
        p_date: new Date().toISOString()
    })
    console.log('RPC Result:', rpcResult, 'Error:', rpcError?.message || 'none')

    // 2. Check if it was inserted
    if (rpcResult === 'INSERTED') {
        const { data: inserted } = await supabase
            .from('fin_transactions')
            .select('*')
            .eq('provider_tx_id', testId)
            .single()
        console.log('Inserted row:', JSON.stringify(inserted, null, 2))

        // Cleanup
        await supabase.from('fin_transactions').delete().eq('provider_tx_id', testId)
        console.log('Cleaned up test row.')
    }

    // 3. Check table column info via a test insert with all edge cases
    console.log('\n=== 2. Check what categories are currently in DB ===')
    const { data: categories } = await supabase
        .from('fin_transactions')
        .select('category, type')
        .eq('profile', 'personal')
        .order('category')

    const catCount = {}
    for (const row of (categories || [])) {
        const k = `${row.type}/${row.category}`
        catCount[k] = (catCount[k] || 0) + 1
    }
    console.log('Type/Category distribution:')
    Object.entries(catCount).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`))

    // 4. Check if there's a check constraint on 'type'
    console.log('\n=== 3. Test inserting with various type values ===')
    for (const type of ['spend', 'income', 'transfer', 'card', 'debit']) {
        const tid = `tx_TYPETEST_${type}_${Date.now()}`
        const { data: res, error: err } = await supabase.rpc('process_monzo_transaction', {
            p_provider_tx_id: tid,
            p_description: `Test ${type}`,
            p_amount: 0.01,
            p_type: type,
            p_category: 'general',
            p_pocket_id: null,
            p_profile: 'personal',
            p_date: new Date().toISOString()
        })
        console.log(`  type='${type}': ${res || 'null'} ${err ? '❌ ' + err.message : ''}`)
        if (res === 'INSERTED') {
            await supabase.from('fin_transactions').delete().eq('provider_tx_id', tid)
        }
    }
}

run().catch(console.error)
