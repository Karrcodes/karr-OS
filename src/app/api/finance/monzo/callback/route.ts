import { NextResponse } from 'next/server'
import { MonzoService } from '@/features/finance/services/MonzoService'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

    try {
        // This is a single-user system identifying as 'karr'
        const userId = 'karr'

        const tokenData = await MonzoService.exchangeCode(code)
        await MonzoService.saveToken(userId, tokenData)

        // Trigger initial sync to create/map pots immediately
        try {
            await MonzoService.syncPots(userId)
        } catch (syncError) {
            console.error('Initial Monzo sync failed:', syncError)
            // We still redirect to success because the connection is technically active
        }

        // Redirect back to finance dashboard with success
        return NextResponse.redirect(new URL('/finances?monzo=connected', request.url))
    } catch (error: any) {
        console.error('Monzo callback error:', error)
        return NextResponse.redirect(new URL(`/finances?error=${encodeURIComponent(error.message)}`, request.url))
    }
}
