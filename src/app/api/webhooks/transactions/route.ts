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
        let { amount, merchant, date, notificationText } = body

        // If the user sends the raw iOS notification text, parse it automatically
        // Example: "Paid £1 at Wikimedia\nDaily Essentials Balance: £87.90"
        if (notificationText) {
            const match = notificationText.match(/Paid £([0-9.,]+) (?:at|to) (.*?)(?:\n|$)/i)
            if (match) {
                amount = amount || match[1].replace(',', '')
                merchant = merchant || match[2].trim()
            }
        }

        // Fallback to mock data if fields are missing (e.g. from pressing 'Play' in Shortcuts)
        const finalAmount = amount !== undefined ? amount : 1.00
        const finalMerchant = merchant || 'Test Transaction (Shortcut Play Button)'

        // Parse date properly (fallback to now if invalid or missing)
        let transDate = new Date()
        if (date) {
            const parsedDate = new Date(date)
            // Check if the parsed date is valid before using it
            if (!isNaN(parsedDate.getTime())) {
                transDate = parsedDate
            } else {
                console.warn(`Webhook received invalid date string: "${date}". Falling back to current time.`)
            }
        }

        // 3. Database Mapping
        // We map 'merchant' -> 'description'
        // 'amount' -> 'amount'
        // 'type' -> 'spend'
        // 'pocket_id' -> null (Requires categorisation later in UI)
        // 'profile' -> 'personal'
        const transactionData = {
            amount: Number(finalAmount),
            description: finalMerchant,
            date: transDate.toISOString(),
            type: 'spend',
            pocket_id: null,
            profile: 'personal',
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
