import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ebRequest } from '@/lib/enable-banking'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const code = searchParams.get('code')
        const profile = searchParams.get('profile') || 'personal'

        if (!code) {
            return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
        }

        // 1. Exchange code for session_id
        const session = await ebRequest('/sessions', {
            method: 'POST',
            body: JSON.stringify({ code })
        })

        const session_id = session.session_id

        // 2. Save connection to Supabase
        const { error } = await supabase.from('fin_bank_connections').insert({
            requisition_id: session_id,
            institution_id: session.aspsp, // 'revolut_gb' etc
            status: 'active',
            profile: profile,
            last_synced: new Date().toISOString()
        })

        if (error) {
            console.error('Supabase Insert Error:', error)
            return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('EB Callback Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
