require('dotenv').config({ path: '.env.local' })

const BASE = 'https://karr-os.vercel.app'

async function callRoute(path) {
    console.log(`\nCalling: ${path}`)
    const res = await fetch(`${BASE}${path}`)
    const data = await res.json()
    console.log(`Status: ${res.status}`)
    console.log(`Result:`, JSON.stringify(data, null, 2))
}

async function run() {
    // Fire all three in sequence so notifications arrive separately
    await callRoute('/api/cron/finance-morning')
    await new Promise(r => setTimeout(r, 2000))
    await callRoute('/api/cron/finance-evening')
}

run().catch(console.error)
