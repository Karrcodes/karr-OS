import { NextRequest, NextResponse } from 'next/server'
import { ebRequest } from '@/lib/enable-banking'

export async function POST(req: NextRequest) {
    try {
        const { institution_id = 'revolut_gb', profile = 'personal' } = await req.json()

        // The URL Enable Banking will redirect back to
        const redirectUrl = `${new URL(req.url).origin}/finances/callback?profile=${profile}`

        const state = Math.random().toString(36).substring(7)
        const ninetyDaysFromNow = new Date(Date.now() + 86400000 * 90).toISOString()

        const session = await ebRequest('/auth', {
            method: 'POST',
            body: JSON.stringify({
                access: {
                    valid_until: ninetyDaysFromNow,
                    balances: true,
                    transactions: true
                },
                aspsp: {
                    name: institution_id, // 'revolut_gb'
                    country: 'GB'
                },
                state: state,
                redirect_url: redirectUrl,
                psu_type: 'personal'
            })
        })

        return NextResponse.json({
            link: session.url,
            session_id: session.session_id
        })
    } catch (error: any) {
        console.error('EB Connect Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
