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
        console.log('Webhook Received Body:', JSON.stringify(body, null, 2));
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
  "merchant": string,
  "is_online": boolean
}

Notification:
"${notificationText}"`;

                const result = await geminiModel.generateContent(prompt);
                const aiResponseText = result.response.text().trim();
                console.log('AI Raw Response:', aiResponseText);

                const cleaned = aiResponseText.replace(/```json?/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleaned);

                if (parsed.amount !== undefined && parsed.amount !== null) amount = parsed.amount;
                if (parsed.merchant) merchant = parsed.merchant;
                (body as any).is_online = parsed.is_online || false;
                console.log('Final Parsed Values:', { merchant, amount, is_online: (body as any).is_online });
            } catch (aiError) {
                console.error('AI Parsing Error:', aiError);
            }
        }

        if (amount === undefined || amount === null) {
            console.error('Final Check: Missing amount after AI parse attempt.');
            return NextResponse.json({
                error: 'Missing amount',
                received: body,
                ai_parsed: { merchant, amount }
            }, { status: 400 });
        }

        if (!merchant) {
            return NextResponse.json({ error: 'Missing merchant' }, { status: 400 });
        }

        // 3. Insert the transaction into the database
        // Clean the amount in case it's a string with currency symbols
        const cleanAmount = typeof amount === 'string'
            ? parseFloat(amount.replace(/[^\d.-]/g, ''))
            : parseFloat(amount as any);

        if (isNaN(cleanAmount)) {
            console.error('Final Check: Amount after parsing is NaN.', { amount });
            return NextResponse.json({ error: 'Invalid amount format' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('fin_transactions')
            .insert([{
                description: merchant,
                amount: cleanAmount,
                date: new Date().toISOString(),
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

        // 4. Trigger Push Notification
        try {
            const { sendPushNotification } = await import('@/lib/push-server');

            const isOnline = (body as any).is_online || false;
            const title = isOnline ? '💳 Online Spend' : 'New Transaction';
            const bodyText = isOnline
                ? `You spent £${parseFloat(amount).toFixed(2)} at ${merchant}. Tap to verify.`
                : `£${parseFloat(amount).toFixed(2)} at ${merchant}`;

            await sendPushNotification(title, bodyText, '/finances/transactions');
        } catch (pushError) {
            console.error('Failed to send push notification:', pushError);
            // Don't fail the webhook if push fails
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
