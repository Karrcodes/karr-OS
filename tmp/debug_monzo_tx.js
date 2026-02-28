/**
 * Debug: Fetch Monzo transactions directly and show what the API returns
 * Run: node tmp/debug_monzo_tx.js
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getToken() {
    const { data, error } = await supabase
        .from('fin_secrets')
        .select('secret_data')
        .eq('service', 'monzo')
        .single()

    if (error || !data) throw new Error('No Monzo token found')

    const token = data.secret_data
    // Check if expired
    if (Date.now() / 1000 > token.expires_at - 60) {
        console.log('Token expired, refreshing...')
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
        if (!res.ok) throw new Error('Token refresh failed: ' + await res.text())
        const newToken = await res.json()
        // Save
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
    const token = await getToken()
    console.log('Got valid token\n')

    // 1. List accounts
    const accountsRes = await fetch('https://api.monzo.com/accounts', {
        headers: { Authorization: `Bearer ${token}` }
    })
    const { accounts } = await accountsRes.json()
    const active = accounts.filter(a => !a.closed)
    console.log(`Active accounts: ${active.length}`)
    active.forEach(a => console.log(`  - ${a.id} (${a.type})`))
    console.log()

    // 2. For each account, fetch recent transactions with a very wide window (7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    for (const account of active) {
        console.log(`\n==== Transactions for ${account.id} (${account.type}) ====`)
        console.log(`Fetching since: ${since}\n`)

        const url = `https://api.monzo.com/transactions?account_id=${account.id}&since=${since}&limit=100&expand[]=merchant`
        const txRes = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        })

        if (!txRes.ok) {
            console.log('  ERROR:', txRes.status, await txRes.text())
            continue
        }

        const { transactions } = await txRes.json()
        console.log(`  Total transactions returned: ${transactions?.length ?? 0}`)
        console.log()

        if (!transactions || transactions.length === 0) {
            console.log('  No transactions returned by Monzo API.')
            console.log('  -> This is likely an SCA restriction. Try approving again via Monzo app.')
            continue
        }

        for (const tx of transactions) {
            const time = new Date(tx.created).toLocaleTimeString('en-GB')
            const date = new Date(tx.created).toLocaleDateString('en-GB')
            const merchant = tx.merchant?.name || tx.description || 'No merchant'
            const amount = (tx.amount / 100).toFixed(2)
            const category = tx.category
            const declined = tx.decline_reason ? ` [DECLINED: ${tx.decline_reason}]` : ''
            console.log(`  [${date} ${time}] £${amount} | ${category} | ${merchant}${declined}`)
        }
    }
}

run().catch(console.error)
