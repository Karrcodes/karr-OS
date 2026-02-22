import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const subscription = await req.json()

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
        }

        // Save to Supabase (using service role to bypass RLS for system table)
        const { error } = await supabase
            .from('sys_push_subscriptions')
            .upsert({
                subscription,
                user_id: 'karr', // System default
                updated_at: new Date().toISOString()
            }, { onConflict: 'subscription' as any })

        if (error) {
            console.error('Database error saving subscription:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
