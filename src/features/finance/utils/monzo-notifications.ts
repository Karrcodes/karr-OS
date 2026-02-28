import { sendPushNotification } from '@/lib/push-server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function notifyMonzoTransaction(tx: {
    amount: number,
    description: string,
    isSpend: boolean,
    isTransfer: boolean,
    pocketName: string,
    pocketId?: string | null
}) {
    // 1. Check global user preferences
    const { data: userSettings } = await supabase
        .from('sys_settings')
        .select('key, value')
        .eq('key', 'notification_transactions')
        .single()

    if (userSettings?.value === 'false') {
        console.log('[notifyMonzoTransaction] Skipped: notification_transactions is disabled in settings')
        return { success: true, message: 'Disabled in settings' }
    }

    let title = tx.isTransfer ? 'Monzo Transfer' : (tx.isSpend ? 'Monzo Spend' : 'Monzo Received')

    let bodyText = ''
    if (tx.isTransfer && tx.description.startsWith('Transferred ')) {
        title = `Monzo`
        bodyText = `£${tx.amount.toFixed(2)} • ${tx.description}`
    } else if (tx.isTransfer) {
        title = `Monzo`
        bodyText = tx.isSpend
            ? `£${tx.amount.toFixed(2)} from ${tx.pocketName}: ${tx.description}`
            : `£${tx.amount.toFixed(2)} into ${tx.pocketName}: ${tx.description}`
    } else {
        bodyText = tx.isSpend
            ? `£${tx.amount.toFixed(2)} from ${tx.pocketName}: ${tx.description}`
            : `£${tx.amount.toFixed(2)} in ${tx.pocketName}: ${tx.description}`

        // Add allocation percentage if it's a pocket spend (not main account)
        if (tx.isSpend && tx.pocketId && tx.pocketName.toLowerCase() !== 'main account') {
            try {
                const { data: pocket } = await supabase
                    .from('fin_pockets')
                    .select('target_budget, balance')
                    .eq('id', tx.pocketId)
                    .single()

                if (pocket && pocket.target_budget > 0) {
                    const spent = Math.max(0, pocket.target_budget - pocket.balance)
                    const pctUsed = Math.min(100, Math.round((spent / pocket.target_budget) * 100))
                    bodyText += ` (${pctUsed}% of allocation used)`
                }
            } catch (err) {
                console.error('[notifyMonzoTransaction] Error calculating allocation:', err)
            }
        }
    }

    return await sendPushNotification(title, bodyText, '/finances/transactions')
}
