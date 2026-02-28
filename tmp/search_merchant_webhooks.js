/**
 * Deep search: Did Monzo send webhooks for the Karrtesian/ShareTheMeal transactions?
 * Check all webhook logs since 11:50 UTC and look for merchant transactions.
 * Run: node tmp/search_merchant_webhooks.js
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

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
    // 1. Look at ALL webhook log entries since 11:50 to find merchant webhooks
    const since = new Date('2026-02-28T11:50:00Z').toISOString()
    const { data: logs, error } = await supabase
        .from('sys_notification_logs')
        .select('title, body, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(200)

    if (error) { console.error(error); return }

    // Separate webhook hits from other logs
    const webhookHits = logs.filter(l => l.title === 'DEBUG: Webhook Hit')
    console.log(`Total logs since 11:50: ${logs.length}`)
    console.log(`Webhook hits: ${webhookHits.length}`)
    console.log()

    // Parse all unique transaction IDs from webhooks
    const txIds = new Set()
    const txDetails = {}
    for (const hit of webhookHits) {
        try {
            const body = JSON.parse(hit.body)
            const id = body.data?.id
            const merchant = body.data?.merchant?.name || body.data?.description || 'unknown'
            const amount = body.data?.amount
            const category = body.data?.category
            if (id) {
                txIds.add(id)
                txDetails[id] = { merchant, amount, category, time: new Date(hit.created_at).toLocaleTimeString('en-GB'), type: body.type }
            }
        } catch { }
    }

    console.log(`Unique transaction IDs seen in webhooks: ${txIds.size}`)
    for (const [id, details] of Object.entries(txDetails)) {
        console.log(`  [${details.time}] ${details.type} | £${(details.amount / 100).toFixed(2)} | ${details.category} | ${details.merchant} | ID: ${id}`)
    }

    // 2. Check Monzo API with broader window - 4 hours
    console.log('\n=== Monzo API: Last 4 Hours ===')
    const token = await getToken()
    const accountsRes = await fetch('https://api.monzo.com/accounts', {
        headers: { Authorization: `Bearer ${token}` }
    })
    const { accounts } = await accountsRes.json()
    const since4h = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

    for (const account of accounts.filter(a => !a.closed)) {
        const url = `https://api.monzo.com/transactions?account_id=${account.id}&since=${since4h}&limit=100&expand[]=merchant`
        const txRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        const txData = await txRes.json()
        console.log(`\nAccount ${account.id} (${account.type}): ${txData.transactions?.length ?? 0} transactions`)
        for (const tx of (txData.transactions || [])) {
            const time = new Date(tx.created).toLocaleTimeString('en-GB')
            console.log(`  ${tx.id} | [${time}] £${(tx.amount / 100).toFixed(2)} | ${tx.category} | ${tx.merchant?.name || tx.description}`)
        }
    }
}

run().catch(console.error)
