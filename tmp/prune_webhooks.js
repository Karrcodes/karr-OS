/**
 * PRUNE: Delete all but the most recent webhook per account.
 * Run: node tmp/prune_webhooks.js
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
                refresh_token: token.refresh_refresh
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
    const token = await getToken()
    const accountsRes = await fetch('https://api.monzo.com/accounts', {
        headers: { Authorization: `Bearer ${token}` }
    })
    const { accounts } = await accountsRes.json()
    const targetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/finance/monzo/webhook`

    for (const account of accounts.filter(a => !a.closed)) {
        console.log(`\nAccount: ${account.id}`)

        const whRes = await fetch(`https://api.monzo.com/webhooks?account_id=${account.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const { webhooks } = await whRes.json()
        console.log(`  Found ${webhooks?.length ?? 0} webhooks`)

        if (!webhooks || webhooks.length === 0) {
            // Register a fresh one
            console.log('  No webhooks found — registering one...')
            const reg = await fetch('https://api.monzo.com/webhooks', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ account_id: account.id, url: targetUrl })
            })
            const regData = await reg.json()
            console.log('  Registered:', regData.webhook?.id)
            continue
        }

        // Sort by ID (newest last in Monzo's scheme), keep only the last one
        const sorted = [...webhooks].sort((a, b) => a.id.localeCompare(b.id))
        const keep = sorted[sorted.length - 1]
        const toDelete = sorted.slice(0, sorted.length - 1)

        console.log(`  Keeping: ${keep.id}`)
        console.log(`  Deleting: ${toDelete.length} duplicates...`)

        for (const wh of toDelete) {
            const del = await fetch(`https://api.monzo.com/webhooks/${wh.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (del.ok) {
                console.log(`  Deleted: ${wh.id}`)
            } else {
                console.log(`  Failed to delete ${wh.id}: ${del.status}`)
            }
        }
    }

    console.log('\nDone. Re-checking to confirm...')
    for (const account of accounts.filter(a => !a.closed)) {
        const whRes = await fetch(`https://api.monzo.com/webhooks?account_id=${account.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const { webhooks } = await whRes.json()
        console.log(`Account ${account.id}: ${webhooks?.length ?? 0} webhook(s) remaining`)
    }
}

run().catch(console.error)
