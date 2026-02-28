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
    pocketName: string
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

    const emoji = tx.isTransfer ? '🔄' : (tx.isSpend ? '💸' : '💰')
    const title = tx.isTransfer ? 'Monzo Transfer' : (tx.isSpend ? `${emoji} Monzo Spend` : `${emoji} Monzo Received`)

    const bodyText = tx.isSpend
        ? `Spent £${tx.amount.toFixed(2)} from ${tx.pocketName}: ${tx.description}`
        : `Received £${tx.amount.toFixed(2)} in ${tx.pocketName}: ${tx.description}`

    return await sendPushNotification(title, bodyText, '/finances/transactions')
}
