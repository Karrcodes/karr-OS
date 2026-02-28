/**
 * Check: Were webhooks fired for today's new transactions?
 * Also list current registered webhooks.
 * Run: node tmp/diagnose_webhooks.js
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
    console.log('=== 1. Recent Webhook Logs (last 10 mins) ===')
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: logs } = await supabase
        .from('sys_notification_logs')
        .select('title, body, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true })

    if (!logs || logs.length === 0) {
        console.log('NO WEBHOOK LOGS in last 10 minutes! Webhooks are not firing at all.')
    } else {
        for (const log of logs) {
            const time = new Date(log.created_at).toLocaleTimeString('en-GB')
            console.log(`[${time}] ${log.title}: ${(log.body || '').slice(0, 100)}`)
        }
    }

    console.log('\n=== 2. Registered Monzo Webhooks ===')
    const token = await getToken()
    const accountsRes = await fetch('https://api.monzo.com/accounts', {
        headers: { Authorization: `Bearer ${token}` }
    })
    const { accounts } = await accountsRes.json()

    for (const account of accounts.filter(a => !a.closed)) {
        console.log(`\nAccount: ${account.id} (${account.type})`)
        const whRes = await fetch(`https://api.monzo.com/webhooks?account_id=${account.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const whData = await whRes.json()
        const webhooks = whData.webhooks || []
        if (webhooks.length === 0) {
            console.log('  !! NO WEBHOOKS REGISTERED - this is why transactions are missing!')
        } else {
            webhooks.forEach(wh => console.log(`  - ${wh.id}: ${wh.url}`))
        }
    }

    console.log('\n=== 3. Try Monzo API for today\'s transactions (last 2 hours) ===')
    const since2h = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    for (const account of accounts.filter(a => !a.closed)) {
        const url = `https://api.monzo.com/transactions?account_id=${account.id}&since=${since2h}&limit=50&expand[]=merchant`
        const txRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        const txData = await txRes.json()
        console.log(`\nAccount ${account.id}: ${txData.transactions?.length ?? 0} transactions (last 2h)`)
        for (const tx of (txData.transactions || [])) {
            const time = new Date(tx.created).toLocaleTimeString('en-GB')
            console.log(`  [${time}] £${(tx.amount / 100).toFixed(2)} | ${tx.category} | ${tx.merchant?.name || tx.description}`)
        }
    }
}

run().catch(console.error)
