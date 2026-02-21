import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// We need to initialize the admin client (service role) to bypass RLS 
// if the webhook is coming in anonymously from iOS shortcuts.
// For now, we'll try the anon key. If RLS blocks it, we would need the service role key.
// Assuming RLS allows anon inserts based on previous task context, or we just use anon key here.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
    // 1. Security Check
    const authHeader = request.headers.get('authorization')
    const secret = process.env.WEBHOOK_SECRET

    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // 2. Parse Payload
        const body = await request.json()
        const { amount, merchant, date } = body

        if (amount === undefined || !merchant) {
            return NextResponse.json({ error: 'Missing required payload fields: amount, merchant' }, { status: 400 })
        }

        // Parse date properly (fallback to now if invalid or missing)
        const transDate = date ? new Date(date) : new Date()

        // 3. Database Mapping
        // We know we must map 'merchant' -> 'description'
        // 'amount' -> 'amount'
        // 'type' -> 'expense'
        // 'from_pocket' -> 'Main Buffer'
        const transactionData = {
            amount: Number(amount),
            description: merchant,
            date: transDate.toISOString(),
            type: 'expense',
            from_pocket: 'Main Buffer',
        }

        // 4. Insert into Supabase
        const { data, error } = await supabase
            .from('fin_transactions')
            .insert(transactionData)
            .select()

        if (error) {
            console.error('Webhook DB Insert Error:', error)
            return NextResponse.json({ error: 'Database insertion failed', details: error.message }, { status: 500 })
        }

        // 5. Success Return
        return NextResponse.json({ success: true, transaction: data[0] }, { status: 200 })

    } catch (err: any) {
        console.error('Webhook Error:', err)
        return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
    }
}
