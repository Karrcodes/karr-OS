require('dotenv').config({ path: '.env.local' })

async function run() {
    // Call poll endpoint directly (no CRON_SECRET set means open)
    const url = 'https://karr-os.vercel.app/api/finance/monzo/poll'
    console.log(`Calling: ${url}`)
    const res = await fetch(url)
    const data = await res.json()
    console.log('Status:', res.status)
    console.log('Response:', JSON.stringify(data, null, 2))
}

run().catch(console.error)
