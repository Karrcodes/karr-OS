import { sendPushNotification } from '@/lib/push-server'

export async function notifyMonzoTransaction(tx: {
    amount: number,
    description: string,
    isSpend: boolean,
    isTransfer: boolean,
    pocketName: string
}) {
    const emoji = tx.isTransfer ? '🔄' : (tx.isSpend ? '💸' : '💰')
    const title = tx.isTransfer ? 'Monzo Transfer' : (tx.isSpend ? `${emoji} Monzo Spend` : `${emoji} Monzo Received`)

    const bodyText = tx.isSpend
        ? `Spent £${tx.amount.toFixed(2)} from ${tx.pocketName}: ${tx.description}`
        : `Received £${tx.amount.toFixed(2)} in ${tx.pocketName}: ${tx.description}`

    return await sendPushNotification(title, bodyText, '/finances/transactions')
}
