/**
 * One-shot fix: Directly insert missing merchant transactions.
 * The previous sync used limit=50 and missed merchant transactions from 27/02.
 * This script fetches from Monzo with the full window and inserts missing ones.
 * 
 * Run: node tmp/fix_missing_merchant_tx.js
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

function mapCategory(c) {
    const mapping = {
        bills: 'bills', charity: 'charity', eating_out: 'eating_out',
        entertainment: 'entertainment', expenses: 'expenses', family: 'family',
        finances: 'finances', general: 'general', mondo: 'general',
        gifts: 'gifts', groceries: 'groceries', holidays: 'holidays',
        income: 'income', personal_care: 'personal_care', savings: 'savings',
        shopping: 'shopping', transfers: 'transfers', p2p: 'transfers',
        transport: 'transport', cash: 'general', other: 'other'
    }
    return mapping[(c || '').toLowerCase()] || 'other'
}

async function getToken() {
    const { data } = await supabase.from('fin_secrets').select('secret_data').eq('service', 'monzo').single()
    const token = data.secret_data
    if (Date.now() / 1000 > token.expires_at - 60) {
        const res = await fetch('https://api.monzo.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: process.env.NEXT_PUBLIC_MONZO_CLIENT_ID,
                client_secret: process.env.MONZO_CLIENT_SECRET,
                refresh_token: token.refresh_token
            })
        })
        const newToken = await res.json()
        await supabase.from('fin_secrets').update({
            secret_data: {
                access_token: newToken.access_token,
                refresh_token: newToken.refresh_token,
                expires_at: Math.floor(Date.now() / 1000) + newToken.expires_in
            }
        }).eq('service', 'monzo')
        return newToken.access_token
    }
    return token.access_token
}

async function run() {
    console.log('Getting token...')
    const token = await getToken()

    const accountsRes = await fetch('https://api.monzo.com/accounts', { headers: { Authorization: `Bearer ${token}` } })
    const { accounts } = await accountsRes.json()
    const active = accounts.filter(a => !a.closed)

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    let inserted = 0
    let skipped = 0
    let errors = 0

    for (const account of active) {
        const profile = account.type === 'uk_business' ? 'business' : 'personal'
        const url = `https://api.monzo.com/transactions?account_id=${account.id}&since=${since}&limit=200&expand[]=merchant`
        const txRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        const { transactions } = await txRes.json()

        console.log(`\nAccount ${account.id} (${profile}): ${transactions?.length ?? 0} transactions`)

        for (const tx of (transactions || [])) {
            if (tx.decline_reason) { skipped++; continue }

            const amount = Math.abs(tx.amount / 100)
            const isSpend = tx.amount < 0
            const potId = tx.metadata?.pot_id
            const isTransfer = tx.category === 'p2p' || !!potId || (tx.description || '').startsWith('pot_')
            const targetMonzoId = potId || account.id

            const { data: pocket } = await supabase.from('fin_pockets').select('id, name').eq('monzo_id', targetMonzoId).single()

            let description = tx.merchant?.name || tx.description
            if (description?.startsWith('pot_') && pocket) {
                description = isSpend ? `Transfer to ${pocket.name}` : `Top up from ${pocket.name}`
            } else if (tx.category === 'p2p' && tx.counterparty?.name) {
                description = tx.counterparty.name
            }

            const txType = isTransfer ? 'transfer' : (isSpend ? 'spend' : 'income')

            const { data: rpcStatus, error: rpcError } = await supabase.rpc('process_monzo_transaction', {
                p_provider_tx_id: tx.id,
                p_description: description,
                p_amount: amount,
                p_type: txType,
                p_category: mapCategory(tx.category),
                p_pocket_id: pocket?.id || null,
                p_profile: profile,
                p_date: tx.created
            })

            if (rpcError) {
                console.log(`  ERROR ${tx.id}: ${rpcError.message}`)
                errors++
            } else if (rpcStatus === 'INSERTED') {
                console.log(`  INSERTED: ${description} £${amount} (${tx.category})`)
                inserted++
            } else {
                skipped++
            }
        }
    }

    console.log(`\n============================`)
    console.log(`Done! Inserted: ${inserted}, Skipped/Existing: ${skipped}, Errors: ${errors}`)
}

run().catch(console.error)
