import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { geminiModel } from '@/lib/gemini'

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
        let parsedPocketName = null
        let parsedCategory = 'other'

        // If the user sends the raw iOS notification text, parse it automatically via AI
        // Example: "Revolut\nTesco Express, Cardiff Wales\n£1.35"
        if (notificationText) {
            try {
                const prompt = `You are a financial parsing assistant. The user has provided an Apple Pay / Revolut transaction notification text.
Extract the transaction details and determine the correct budget pocket and spending category.

Available Pockets (ONLY choose one of these two):
1. "Daily Essentials 🍔" (for groceries, ALL food and drinks, coffee shops (e.g. Lavazza, Starbucks), convenience stores, taxis, ride booking apps, pharmacies)
2. "Fun 🛍️" (for clothes shopping, Amazon, electronics, expressly sit-down restaurants, pubs, takeaways, entertainment)

Available Categories (ONLY choose one): 'food', 'transport', 'housing', 'shopping', 'entertainment', 'utilities', 'health', 'other'

Notification Text:
"""
${notificationText}
"""

Return ONLY a valid JSON object with the following keys, no markdown, no explanation:
{
  "amount": number (extracted numerical amount, e.g. 1.35),
  "merchant": string (clean merchant name without location/city/country, e.g. "Tesco Express"),
  "target_pocket": string (must be exactly "Daily Essentials 🍔" or "Fun 🛍️"),
  "category": string (one of the allowed categories)
}`
                const result = await geminiModel.generateContent(prompt)
                const text = result.response.text().trim()
                const cleaned = text.replace(/```json?/g, '').replace(/```/g, '').trim()
                const parsed = JSON.parse(cleaned)

                if (parsed.amount) amount = typeof parsed.amount === 'string' ? parseFloat(parsed.amount.replace(/[^0-9.]/g, '')) : parsed.amount
                if (parsed.merchant) merchant = parsed.merchant
                if (parsed.target_pocket) parsedPocketName = parsed.target_pocket
                if (parsed.category) parsedCategory = parsed.category.toLowerCase()

            } catch (aiError) {
                console.error('Webhook AI Parsing Error:', aiError)
                // Fallback extraction if AI fails
                const match = notificationText.match(/£([0-9.,]+)/)
                if (match) amount = amount || parseFloat(match[1].replace(',', ''))
                merchant = merchant || notificationText.split('\n')[1] || 'Unknown Merchant'
            }
        }

        // Fallback to mock data if fields are missing
        const finalAmount = amount !== undefined && !isNaN(parseFloat(amount)) ? parseFloat(amount) : 1.00
        const finalMerchant = merchant || 'Test Transaction (Shortcut Play Button)'

        // Fallback pocket specifically requested by the user for testing
        if (!parsedPocketName) {
            parsedPocketName = 'Daily Essentials 🍔'
        }

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

        // 3. Resolve Pocket
        let resolvedPocketId = null
        if (parsedPocketName) {
            // Lookup the exact pocket name in KarrOS for the personal profile
            const { data: pocketData } = await supabase
                .from('fin_pockets')
                .select('id, balance')
                .eq('profile', 'personal')
                .ilike('name', parsedPocketName)
                .single()

            if (pocketData) {
                resolvedPocketId = pocketData.id

                // 3.5 Deduct Balance
                const newBalance = Number(pocketData.balance) - Number(finalAmount)
                const { error: updateError } = await supabase
                    .from('fin_pockets')
                    .update({ balance: newBalance })
                    .eq('id', resolvedPocketId)

                if (updateError) {
                    console.error('Webhook Pocket Update Error:', updateError)
                }
            } else {
                console.warn(`Webhook: Could not find a KarrOS pocket named "${parsedPocketName}"`)
            }
        }

        // 4. Database Mapping
        // We map 'merchant' -> 'description'
        // 'amount' -> 'amount'
        // 'type' -> 'spend'
        // 'category' -> parsedCategory
        // 'pocket_id' -> resolved ID or null
        // 'profile' -> 'personal'
        const transactionData = {
            amount: Number(finalAmount),
            description: finalMerchant,
            date: transDate.toISOString(),
            type: 'spend',
            category: parsedCategory,
            pocket_id: resolvedPocketId,
            profile: 'personal',
        }

        // 5. Insert into Supabase
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
