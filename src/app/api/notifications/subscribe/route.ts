import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const subscription = await req.json()

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
        }

        // Initialize Supabase with the Service Role Key to bypass RLS securely
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Supabase credentials missing in API route')
            return NextResponse.json({ error: 'Server config error' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Save to Supabase using RPC to handle JSONB upsert logic
        const { error } = await supabase.rpc('upsert_push_subscription', {
            p_subscription: subscription,
            p_user_id: 'karr'
        })

        if (error) {
            console.error('Database error saving subscription:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Subscription API crash:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
