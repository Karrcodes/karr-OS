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
            try {
                const prompt = `Extract transaction details from the following notification text.
Return ONLY a valid JSON object with the following keys, no markdown:
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
        const { data, error } = await supabase
            .from('revolut_transactions')
            .insert([{
                merchant: merchant,
                amount: parseFloat(amount)
            }])
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Transaction logged securely.',
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
