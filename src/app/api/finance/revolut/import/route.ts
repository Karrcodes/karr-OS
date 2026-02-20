import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function categoriseDescription(desc: string): string {
    const d = desc.toLowerCase()

    // Groceries & Food
    if (d.includes('tesco') || d.includes('sainsbury') || d.includes('asda') || d.includes('morrisons') || d.includes('aldi') || d.includes('lidl') || d.includes('waitrose') || d.includes('co-op') || d.includes('marks & spencer') || d.includes('m&s')) return 'groceries'
    if (d.includes('deliveroo') || d.includes('uber eats') || d.includes('just eat') || d.includes('dominos') || d.includes('mcdonalds') || d.includes('kfc') || d.includes('burger king')) return 'takeaway'
    if (d.includes('starbucks') || d.includes('costa') || d.includes('pret a manger') || d.includes('caffe nero') || d.includes('cafe')) return 'coffee'
    if (d.includes('restaurant') || d.includes('pub') || d.includes('bar') || d.includes('nandos') || d.includes('wagamama') || d.includes('pizza express')) return 'dining'

    // Transport
    if (d.includes('tfl') || d.includes('transport for london') || d.includes('trainline') || d.includes('northern rail') || d.includes('lner') || d.includes('gwr')) return 'transport'
    if (d.includes('uber') || d.includes('bolt') || d.includes('free-now')) return 'taxi'

    // Shopping
    if (d.includes('amazon') || d.includes('amzn') || d.includes('argos') || d.includes('john lewis') || d.includes('boots') || d.includes('superdrug')) return 'shopping'
    if (d.includes('asos') || d.includes('zara') || d.includes('h&m') || d.includes('primark') || d.includes('next')) return 'clothing'
    if (d.includes('currys') || d.includes('apple') || d.includes('pc world')) return 'electronics'

    // Entertainment & Subs
    if (d.includes('netflix') || d.includes('spotify') || d.includes('amazon prime') || d.includes('disney+') || d.includes('now tv') || d.includes('apple') || d.includes('youtube')) return 'subscriptions'
    if (d.includes('cinema') || d.includes('odeon') || d.includes('vue') || d.includes('cineworld')) return 'entertainment'
    if (d.includes('gym') || d.includes('puregym') || d.includes('david lloyd') || d.includes('fitness first')) return 'health'

    // Bills
    if (d.includes('british gas') || d.includes('eon') || d.includes('e.on') || d.includes('edf') || d.includes('ovo') || d.includes('octopus') || d.includes('thames water')) return 'utilities'
    if (d.includes('ee ') || d.includes('o2 ') || d.includes('vodafone') || d.includes('three') || d.includes('virgin media') || d.includes('bt ') || d.includes('sky ')) return 'telecom'
    if (d.includes('council tax')) return 'housing'

    return 'other'
}

export async function POST(req: NextRequest) {
    try {
        const { csvText, profile = 'personal', wipeExisting = false } = await req.json()

        if (!csvText) {
            return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 })
        }

        if (wipeExisting) {
            await supabase
                .from('fin_transactions')
                .delete()
                .eq('profile', profile)
                .eq('provider', 'revolut_csv')
        }

        const lines = csvText.split('\n')
        if (lines.length < 2) {
            return NextResponse.json({ error: 'Empty or invalid CSV' }, { status: 400 })
        }

        const header = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''))

        const colMap = {
            date: header.findIndex((h: string) => h.toLowerCase().includes('date') || h.toLowerCase() === 'started'),
            description: header.findIndex((h: string) => h.toLowerCase().includes('description')),
            amount: header.findIndex((h: string) => h.toLowerCase() === 'amount'),
            type: header.findIndex((h: string) => h.toLowerCase() === 'type')
        }

        if (colMap.amount === -1 || colMap.description === -1) {
            return NextResponse.json({ error: 'Could not identify required CSV columns (Amount, Description)' }, { status: 400 })
        }

        // ── Step 1: Parse all rows ──────────────────────────────────────────────
        const parsed: Array<{
            amount: number, type: string, description: string,
            date: string, emoji: string, profile: string,
            provider: string, provider_tx_id: string
        }> = []

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const row = line.split(',').map((r: string) => r.trim().replace(/"/g, ''))

            const rawAmount = row[colMap.amount]
            if (!rawAmount) continue

            const amount = parseFloat(rawAmount)
            if (isNaN(amount)) continue

            const description = row[colMap.description] || 'Revolut Transaction'
            const date = row[colMap.date] || new Date().toISOString()
            const revolutType = (colMap.type >= 0 ? row[colMap.type] : '').toUpperCase().replace(/ /g, '_')
            const providerTxId = `rev_${Buffer.from(`${profile}${date}${amount}${description}`).toString('base64').substring(0, 32)}`

            // ── Classify using Revolut's own Type column ──────────────────────
            // EXCHANGE = currency conversion (not real spend/income), skip entirely
            if (revolutType === 'EXCHANGE') continue

            const isSalary = description.toLowerCase().includes('payment from u u k')

            let txType: 'spend' | 'income' | 'transfer'
            if (revolutType === 'CARD_PAYMENT' || revolutType === 'ATM' || revolutType === 'FEE') {
                txType = 'spend'
            } else if (isSalary) {
                // Only your employer transfer counts as true income
                txType = 'income'
            } else {
                // All other transfers, top-ups, cashback, refunds → not spend, not income
                txType = 'transfer'
            }

            parsed.push({
                amount: Math.abs(amount),
                type: txType,
                description,
                date: date.split(' ')[0],
                emoji: txType === 'spend' ? '💸' : txType === 'income' ? '💰' : '🔄',
                profile,
                provider: 'revolut_csv',
                provider_tx_id: providerTxId
            })

        }

        // ── Step 2: Local Rule-Based Categorisation ──────────────────────────
        const transactions = parsed.map(p => ({
            ...p,
            category: p.type === 'spend' ? categoriseDescription(p.description) : 'other'
        }))
        const { error: insertError, data } = await supabase
            .from('fin_transactions')
            .upsert(transactions, { onConflict: 'provider_tx_id' })
            .select()

        if (insertError) {
            console.error('Supabase Import Error:', insertError)
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            count: data?.length || 0,
            message: `Successfully imported ${data?.length || 0} transactions with AI categorisation.`
        })

    } catch (error: any) {
        console.error('Revolut Import Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
