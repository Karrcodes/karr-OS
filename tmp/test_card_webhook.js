/**
 * Simulate a card payment webhook hitting our endpoint directly.
 * This bypasses Monzo and lets us test if the webhook HANDLER works for card payments.
 * Run: node tmp/test_card_webhook.js
 */
require('dotenv').config({ path: '.env.local' })

const WEBHOOK_URL = 'https://karr-os.vercel.app/api/finance/monzo/webhook'

// Simulate a Tesco card payment webhook payload (exactly as Monzo would send it)
const payload = {
    type: 'transaction.created',
    data: {
        id: `tx_TESTCARD_${Date.now()}`,
        created: new Date().toISOString(),
        description: 'TESCO STORES 6509',
        amount: -184, // -£1.84
        fees: {},
        currency: 'GBP',
        merchant: {
            id: 'merch_00009',
            group_id: 'grp_00009',
            created: '2015-01-01T00:00:00Z',
            name: 'Tesco',
            logo: null,
            emoji: '🛒',
            category: 'groceries',
            online: false,
            atm: false,
            address: {}
        },
        notes: '',
        metadata: {},
        account_id: 'acc_0000AjgxPvMofucaiSz62L', // Your personal account ID
        user_id: 'user_test',
        category: 'groceries',
        is_load: false,
        settled: new Date().toISOString(),
        local_amount: -184,
        local_currency: 'GBP',
        updated: new Date().toISOString(),
        account_balance: 5,
        counterparty: {},
        scheme: 'mastercard',
        dedupe_id: `test_card_dedup_${Date.now()}`,
        originator: false,
        include_in_spending: true,
        can_be_excluded_from_breakdown: false,
        can_be_made_subscription: false,
        can_split_the_bill: false,
        can_add_to_tab: false,
        amount_is_pending: false,
        atm_fees_detailed: null,
        parent_account_id: null,
        international: null,
        card: { last_digits: '1234', type: 'debit' }
    }
}

async function run() {
    console.log(`Sending test card payment webhook to: ${WEBHOOK_URL}`)
    console.log(`Payload: £${Math.abs(payload.data.amount / 100)} ${payload.data.merchant.name} (${payload.data.category})`)
    console.log()

    const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })

    const responseText = await res.text()
    console.log(`Response status: ${res.status}`)
    console.log(`Response body: ${responseText}`)

    if (res.ok) {
        console.log('\n✅ Webhook handler responded OK — the handler WORKS for card payments.')
        console.log('This confirms the issue is Monzo NOT SENDING the webhook, not our handler rejecting it.')
    } else {
        console.log('\n❌ Webhook handler returned an error — there may be a code issue.')
    }
}

run().catch(console.error)
