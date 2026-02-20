import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Chunk an array into groups of `size`
function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
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
            const providerTxId = `rev_${Buffer.from(`${date}${amount}${description}`).toString('base64').substring(0, 32)}`

            parsed.push({
                amount: Math.abs(amount),
                type: amount < 0 ? 'spend' : 'income',
                description,
                date: date.split(' ')[0],
                emoji: amount < 0 ? '💸' : '💰',
                profile,
                provider: 'revolut_csv',
                provider_tx_id: providerTxId
            })
        }

        // ── Step 2: AI-categorise in batches of 25 ─────────────────────────────
        const descriptions = parsed.map(p => p.description)
        const categories: string[] = new Array(parsed.length).fill('other')

        const batches = chunk(descriptions, 25)
        let offset = 0

        for (const batch of batches) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
                const res = await fetch(`${baseUrl}/api/ai/categorise`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descriptions: batch })
                })
                if (res.ok) {
                    const { categories: batchCats } = await res.json()
                    batchCats.forEach((cat: string, idx: number) => {
                        categories[offset + idx] = cat
                    })
                }
            } catch {
                // Silently fall back to 'other' for this batch
            }
            offset += batch.length
        }

        // ── Step 3: Merge categories and upsert ────────────────────────────────
        const transactions = parsed.map((p, i) => ({ ...p, category: categories[i] }))

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
