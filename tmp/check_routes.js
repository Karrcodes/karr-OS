require('dotenv').config({ path: '.env.local' })

async function checkRoute(path) {
    const url = `https://karr-os.vercel.app${path}`
    const res = await fetch(url)
    console.log(`${path}: HTTP ${res.status}`)
    const text = await res.text()
    console.log(`  Body preview: ${text.slice(0, 200)}`)
    console.log()
}

async function run() {
    await checkRoute('/api/cron/finance-morning')
    await checkRoute('/api/cron/finance-evening')
    await checkRoute('/api/finance/monzo/poll')
}

run().catch(console.error)
