import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification } from '@/lib/push-server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { type, data } = body

        if (type !== 'transaction.created') {
            return NextResponse.json({ success: true, message: 'Ignored event type' })
        }

        const amount = Math.abs(data.amount / 100)
        const isSpend = data.amount < 0
        const isTransfer = data.category === 'p2p' || !!data.metadata?.pot_id
        const description = data.merchant?.name || data.description
        const monzoTxId = data.id
        const potId = data.metadata?.pot_id // Monzo Pot ID if applicable

        // 1. Find the pocket in KarrOS
        // We look for any pocket where monzo_id matches either the pot_id or the account_id
        const targetMonzoId = potId || data.account_id
        let pocketId = null
        let pocketName = 'Main Account'
        let profile: 'personal' | 'business' = 'personal'

        const { data: pocket } = await supabase
            .from('fin_pockets')
            .select('id, name, profile')
            .eq('monzo_id', targetMonzoId)
            .single()

        if (pocket) {
            pocketId = pocket.id
            pocketName = pocket.name
            profile = pocket.profile as any
        } else {
            console.warn(`[MonzoWebhook] No pocket found for monzo_id: ${targetMonzoId}. Defaulting to personal General.`)
            const { data: genPot } = await supabase
                .from('fin_pockets')
                .select('id, profile')
                .ilike('name', 'General')
                .eq('profile', 'personal')
                .single()
            if (genPot) {
                pocketId = genPot.id
                profile = genPot.profile as any
            }
        }

        // 2. Improve description for transfers/pots
        let finalDescription = description
        if (description.startsWith('pot_') && pocket) {
            finalDescription = isSpend ? `Transfer to ${pocketName}` : `Top up from ${pocketName}`
        }

        // 3. Process Transaction Atomically (Deduplication + Insert)
        const { data: wasProcessed, error: rpcError } = await supabase.rpc('process_monzo_transaction', {
            p_provider_tx_id: monzoTxId,
            p_description: finalDescription,
            p_amount: amount,
            p_type: isSpend ? 'spend' : 'income',
            p_category: data.category || 'other',
            p_pocket_id: pocketId,
            p_profile: profile,
            p_date: data.created
        })

        if (rpcError) {
            console.error('[MonzoWebhook] RPC Error:', rpcError)
            return NextResponse.json({ error: 'Database processing error' }, { status: 500 })
        }

        if (!wasProcessed) {
            console.log(`[MonzoWebhook] Transaction ${monzoTxId} already handled or concurrently processed. Skipping.`)
            return NextResponse.json({ success: true, message: 'Already processed' })
        }

        // 4. Send Notification
        // Dedup: For internal transfers, only notify once (on the outgoing side)
        const shouldNotify = !isTransfer || isSpend

        let notificationStatus = 'skipped'
        if (shouldNotify) {
            const emoji = isTransfer ? '🔄' : (isSpend ? '💸' : '💰')
            const title = isTransfer ? 'Monzo Transfer' : (isSpend ? `${emoji} Monzo Spend` : `${emoji} Monzo Received`)
            const bodyText = isSpend
                ? `Spent £${amount.toFixed(2)} from ${pocketName}: ${finalDescription}`
                : `Received £${amount.toFixed(2)} in ${pocketName}: ${finalDescription}`

            const result = await sendPushNotification(title, bodyText, '/finances/transactions')
            notificationStatus = result.success ? 'sent' : `failed: ${result.error || result.message}`
        }

        return NextResponse.json({
            success: true,
            wasProcessed,
            shouldNotify,
            notificationStatus
        })
    } catch (err: any) {
        console.error('[MonzoWebhook] Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
