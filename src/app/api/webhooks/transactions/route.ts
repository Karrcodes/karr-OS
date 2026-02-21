import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { geminiModel } from '@/lib/gemini'

// Use SERVICE_ROLE_KEY if available to bypass RLS for the webhook
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
    // 1. Security Check
    const authHeader = request.headers.get('authorization')
    const secret = process.env.WEBHOOK_SECRET

    console.log('Webhook: Received request. Auth presence:', !!authHeader)

    // Lenient auth check (handles 'bearer' or 'Bearer' and trims secret)
    const isAuthorized = secret && authHeader &&
        authHeader.toLowerCase() === `bearer ${secret.trim().toLowerCase()}`

    if (!isAuthorized) {
        console.error('Webhook: Unauthorized access attempt. Secret configured:', !!secret)
        return NextResponse.json({
            error: 'Unauthorized',
            debug: {
                authReceived: !!authHeader,
                secretConfigured: !!secret
            }
        }, { status: 401 })
    }

    try {
        // 2. Parse Payload
        const body = await request.json()
        let { amount, merchant, date, notificationText } = body
        let parsedPocketName = null
        let parsedCategory = 'other'
        let aiAmount: number | null = null

        // If the user sends the raw iOS notification text, parse it automatically via AI
        // Example: "Revolut\nTesco Express, Cardiff Wales\n£1.35"
        if (notificationText) {
            try {
                const prompt = `You are a financial parsing assistant. The user has provided an Apple Pay / Revolut transaction notification text.
Extract the transaction details and determine the correct budget pocket and spending category.

Available Pockets (ONLY choose one of these two):
1. "Daily Essentials 🍔" (for groceries, ALL food and drinks, coffee shops, convenience stores, taxis, ride booking apps, pharmacies, charities like ShareTheMeal)
2. "Fun 🛍️" (for clothes shopping, Amazon, electronics, expressly sit-down restaurants, pubs, takeaways, entertainment, online subscriptions)

Available Categories (ONLY choose one): 'food', 'transport', 'housing', 'shopping', 'entertainment', 'utilities', 'health', 'other'

Notification Text Format (multi-line):
Line 1: Bank/App Name (e.g. Revolut)
Line 2: Merchant Name (e.g. ShareTheMeal, Tesco, Apple.com/bill)
Line 3: Amount (e.g. £0.65, .65, 65p)

Notification Text:
"""
${notificationText}
"""

Return ONLY a valid JSON object with the following keys, no markdown, no explanation:
{
  "amount": number (extracted numerical amount, e.g. 0.65),
  "merchant": string (clean merchant name from Line 2, e.g. "ShareTheMeal"),
  "target_pocket": string (must be exactly "Daily Essentials 🍔" or "Fun 🛍️"),
  "category": string (one of the allowed categories)
}`
                console.log('Webhook notification text received:', notificationText)

                const result = await geminiModel.generateContent(prompt)
                const text = result.response.text().trim()
                const cleaned = text.replace(/```json?/g, '').replace(/```/g, '').trim()
                const parsed = JSON.parse(cleaned)

                console.log('Webhook AI parsed result:', parsed)

                // Always use AI amount if it returned a positive number (never fallback to body amount)
                if (parsed.amount != null && !isNaN(Number(parsed.amount)) && Number(parsed.amount) > 0) {
                    aiAmount = typeof parsed.amount === 'string'
                        ? parseFloat(parsed.amount.replace(/[^0-9.]/g, ''))
                        : Number(parsed.amount)
                }
                if (parsed.merchant) merchant = parsed.merchant
                if (parsed.target_pocket) parsedPocketName = parsed.target_pocket
                if (parsed.category) parsedCategory = parsed.category.toLowerCase()

            } catch (aiError) {
                console.error('Webhook AI Parsing Error:', aiError)
                // Fallback: try to extract a currency amount from the notification text
                // Look for £/. OR just a number with a decimal point OR 'p' for pence
                // match[1] = standard decimal (0.65 or .65), match[2] = pence (65p)
                const match = notificationText.match(/[£$€]?\s*([0-9]*[.,][0-9]{2})/) ||
                    notificationText.match(/([0-9]+)\s*p/i)

                if (match) {
                    if (match[1]) {
                        // Decimal format
                        const extracted = parseFloat(match[1].replace(',', '.'))
                        if (!isNaN(extracted) && extracted > 0) aiAmount = extracted
                    } else if (match[2]) {
                        // Pence format (e.g. 65p -> 0.65)
                        const pence = parseInt(match[2])
                        if (!isNaN(pence) && pence > 0) aiAmount = pence / 100
                    }
                    console.log('Webhook: Regex fallback extracted amount:', aiAmount)
                }
                merchant = merchant || notificationText.split('\n')[1] || 'Unknown Merchant'
            }
        }

        // AI amount always wins over body amount. Body amount is only used if AI completely failed.
        const finalAmount = aiAmount ?? (amount !== undefined && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 ? parseFloat(amount) : null)
        const resolvedAmount = aiAmount || (amount !== undefined && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 ? parseFloat(amount) : 0.01)

        if (resolvedAmount === 0.01) {
            console.warn('Webhook: Could not determine transaction amount. Body:', JSON.stringify(body))
        }

        const finalMerchant = merchant || 'Test Transaction'

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
            console.log(`Webhook: Attempting to resolve pocket: "${parsedPocketName}"`)
            // Lookup the exact pocket name in KarrOS for the personal profile
            const { data: pocketData, error: pocketError } = await supabase
                .from('fin_pockets')
                .select('id, balance, name')
                .eq('profile', 'personal')
                .ilike('name', parsedPocketName)
                .single()

            let targetedPocket = pocketData

            // Fallback: If exact match fails, get all pockets and do a fuzzy match in JS
            // (helpful for emoji/encoding or slight spacing mismatches)
            if (pocketError || !pocketData) {
                console.log(`Webhook: Exact pocket match failed for "${parsedPocketName}". Trying fuzzy fallback...`)
                const { data: allPockets } = await supabase
                    .from('fin_pockets')
                    .select('id, balance, name')
                    .eq('profile', 'personal')

                if (allPockets) {
                    // Try matching without emojis or case-insensitive partial match
                    const clean = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim()
                    const targetClean = clean(parsedPocketName)

                    targetedPocket = allPockets.find(p => clean(p.name) === targetClean) || null

                    if (targetedPocket) {
                        console.log(`Webhook: Fuzzy matched to pocket: "${targetedPocket.name}" (${targetedPocket.id})`)
                    }
                }
            }

            if (targetedPocket) {
                resolvedPocketId = targetedPocket.id
                console.log(`Webhook: Successfully resolved pocket ID: ${resolvedPocketId}`)

                // 3.5 Deduct Balance
                const newBalance = Number(targetedPocket.balance) - Number(resolvedAmount)
                console.log(`Webhook: Updating balance for pocket ${resolvedPocketId}: ${targetedPocket.balance} -> ${newBalance}`)
                const { error: updateError } = await supabase
                    .from('fin_pockets')
                    .update({ balance: newBalance })
                    .eq('id', resolvedPocketId)

                if (updateError) {
                    console.error('Webhook: Pocket Balance Update Error:', updateError.message, updateError.details)
                } else {
                    console.log('Webhook: Successfully updated pocket balance.')
                }
            } else {
                console.warn(`Webhook: Could not find any pocket matching "${parsedPocketName}" even with fuzzy fallback.`)
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
            amount: Number(resolvedAmount),
            description: finalMerchant,
            date: transDate.toISOString(),
            type: 'spend',
            category: parsedCategory,
            pocket_id: resolvedPocketId,
            profile: 'personal',
            provider: 'apple_pay',
        }

        // 5. Insert into Supabase
        const { data, error: insertError } = await supabase
            .from('fin_transactions')
            .insert(transactionData)
            .select()

        if (insertError) {
            console.error('Webhook DB Insert Error:', insertError.message, insertError.details)
            return NextResponse.json({
                error: 'Database insertion failed',
                details: insertError.message,
                debug: {
                    parsedAmount: resolvedAmount,
                    parsedMerchant: finalMerchant,
                    pocketId: resolvedPocketId,
                    profile: 'personal'
                }
            }, { status: 500 })
        }

        console.log('Webhook: Successfully inserted transaction:', data?.[0]?.id)

        // 5. Success Return
        return NextResponse.json({
            success: true,
            transaction: data?.[0],
            debug: {
                aiParsed: parsedPocketName,
                resolvedPocketId: resolvedPocketId,
                amount: resolvedAmount
            }
        }, { status: 200 })

    } catch (err: any) {
        console.error('Webhook Error:', err)
        return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 })
    }
}
