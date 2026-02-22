import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { geminiModel } from '@/lib/gemini';

// Initialize Supabase with the Service Role Key to bypass RLS securely
// Ensure these environment variables are set in your Vercel/Local env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        // 1. Verify the request is actually coming from your iPhone
        const authHeader = request.headers.get('authorization');
        const secret = process.env.KARR_OS_WEBHOOK_SECRET;

        if (!secret) {
            console.error('KARR_OS_WEBHOOK_SECRET is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: 'Unauthorized connection' }, { status: 401 });
        }

        // 2. Parse the JSON payload sent by the iOS Shortcut
        const body = await request.json();
        let { merchant, amount, notificationText } = body;

        // AI Parsing Fallback: If raw notification text is provided, use AI to extract merchant/amount
        if (notificationText && (!merchant || amount === undefined)) {
            console.log('Attempting AI parse for text:', notificationText);
            try {
                const prompt = `You are a financial transaction parser. Extract the transaction amount and merchant from the payment notification below.
        
Rules:
- The "amount" should be the actual amount SPENT or CHARGED (the principal value).
- Ignore secondary numbers like balances, store codes, or timestamps (even if they look like amounts).
- If the text says "spent £1.35", the amount is 1.35.
- "merchant" should be the name of the store or service.

Return ONLY a valid JSON object:
{
  "amount": number,
  "merchant": string
}

Notification:
"${notificationText}"`;

                const result = await geminiModel.generateContent(prompt);
                const text = result.response.text().trim();
                const cleaned = text.replace(/```json?/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleaned);

                if (parsed.amount) amount = parsed.amount;
                if (parsed.merchant) merchant = parsed.merchant;
                console.log('AI Parsed:', { merchant, amount });
            } catch (aiError) {
                console.error('AI Parsing Error:', aiError);
            }
        }

        if (!merchant || amount === undefined) {
            return NextResponse.json({ error: 'Missing merchant or amount' }, { status: 400 });
        }

        // 3. Insert the transaction into the database
        // 3. Insert the transaction into the main fin_transactions table so it shows up in the app
        const { data, error } = await supabase
            .from('fin_transactions')
            .insert([{
                description: merchant,
                amount: parseFloat(amount),
                date: new Date().toISOString(), // This now includes full time: YYYY-MM-DDTHH:mm:ss.sssZ
                type: 'spend',
                category: 'other',
                profile: 'personal',
                provider: 'apple_pay'
            }])
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Transaction logged to main ledger.',
            data: data?.[0]
        });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({
            error: 'Failed to process webhook',
            message: error.message
        }, { status: 500 });
    }
}
