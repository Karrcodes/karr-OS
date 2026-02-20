import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

        // Parse Header
        const header = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''))

        const colMap = {
            date: header.findIndex((h: string) => h.toLowerCase().includes('date') || h.toLowerCase() === 'started'),
            description: header.findIndex((h: string) => h.toLowerCase().includes('description')),
            amount: header.findIndex((h: string) => h.toLowerCase() === 'amount'),
            currency: header.findIndex((h: string) => h.toLowerCase().includes('currency')),
            type: header.findIndex((h: string) => h.toLowerCase() === 'type')
        }

        if (colMap.amount === -1 || colMap.description === -1) {
            return NextResponse.json({ error: 'Could not identify required CSV columns (Amount, Description)' }, { status: 400 })
        }

        let totalSynced = 0
        const transactions = []

        // Process rows (starting from line 1)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // Simple CSV split (not handling escaped commas, but Revolut descriptions usually use semicolon or no comma)
            const row = line.split(',').map((r: string) => r.trim().replace(/"/g, ''))

            const rawAmount = row[colMap.amount]
            if (!rawAmount) continue

            const amount = parseFloat(rawAmount)
            if (isNaN(amount)) continue

            const description = row[colMap.description] || 'Revolut Transaction'
            const date = row[colMap.date] || new Date().toISOString()
            const type = row[colMap.type] || ''

            // Generate a unique ID to prevent duplicates
            const providerTxId = `rev_${Buffer.from(`${date}${amount}${description}`).toString('base64').substring(0, 32)}`

            // Basic Categorization Logic
            let category = 'other'
            const desc = description.toLowerCase()
            if (desc.includes('tesco') || desc.includes('sainsbury') || desc.includes('uber eats') || desc.includes('deliveroo') || desc.includes('restaurant') || desc.includes('coffee')) category = 'food'
            else if (desc.includes('uber') || desc.includes('train') || desc.includes('bus') || desc.includes('petrol') || desc.includes('shell') || desc.includes('bp')) category = 'transport'
            else if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('council tax')) category = 'housing'
            else if (desc.includes('amazon') || desc.includes('ebay') || desc.includes('zara') || desc.includes('h&m')) category = 'shopping'
            else if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('disney') || desc.includes('cinema')) category = 'entertainment'
            else if (desc.includes('boiler') || desc.includes('electric') || desc.includes('water') || desc.includes('gas')) category = 'utilities'

            transactions.push({
                amount: Math.abs(amount),
                type: amount < 0 ? 'spend' : 'income',
                description,
                date: date.split(' ')[0], // Get YYYY-MM-DD
                category: category,
                emoji: amount < 0 ? '💸' : '💰',
                profile,
                provider: 'revolut_csv',
                provider_tx_id: providerTxId
            })
        }

        // Bulk insert with upsert to prevent duplicates
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
            message: `Successfully imported ${data?.length || 0} transactions.`
        })

    } catch (error: any) {
        console.error('Revolut Import Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
