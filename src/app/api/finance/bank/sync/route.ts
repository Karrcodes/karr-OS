import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ebRequest } from '@/lib/enable-banking'

export async function POST(req: NextRequest) {
    try {
        const { profile = 'personal' } = await req.json()

        // 1. Fetch Active Connection from DB
        const { data: connections, error: connError } = await supabase
            .from('fin_bank_connections')
            .select('*')
            .eq('profile', profile)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!connections || connError) {
            return NextResponse.json({ error: 'No active bank connection found' }, { status: 404 })
        }

        const sessionId = connections.requisition_id

        // 2. Get Accounts for this Session
        const accountsData = await ebRequest(`/accounts?session_id=${sessionId}`)
        const accounts = accountsData.accounts || []

        let totalSynced = 0

        // 3. For each account, sync transactions
        for (const account of accounts) {
            const accountId = account.uid
            const transData = await ebRequest(`/accounts/${accountId}/transactions?session_id=${sessionId}`)
            const booked = transData.transactions || []

            for (const tx of booked) {
                // tx format from EB: { uid: string, amount: string, currency: string, description: string, date: string, ... }
                const amount = parseFloat(tx.amount)
                const isExpense = amount < 0
                const txId = tx.uid

                // Duplicate check
                const { data: existing } = await supabase
                    .from('fin_transactions')
                    .select('id')
                    .eq('provider_tx_id', txId)
                    .single()

                if (!existing) {
                    const { error: insertError } = await supabase.from('fin_transactions').insert({
                        amount: Math.abs(amount),
                        type: isExpense ? 'spend' : 'income',
                        description: tx.description || 'Bank Transaction',
                        date: tx.date || new Date().toISOString().split('T')[0],
                        category: 'other',
                        emoji: isExpense ? '💸' : '💰',
                        profile: profile,
                        provider: 'enable_banking',
                        provider_tx_id: txId
                    })

                    if (!insertError) totalSynced++
                }
            }
        }

        // 4. Update last_synced
        await supabase.from('fin_bank_connections')
            .update({ last_synced: new Date().toISOString() })
            .eq('id', connections.id)

        return NextResponse.json({ success: true, count: totalSynced })
    } catch (error: any) {
        console.error('EB Sync Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
