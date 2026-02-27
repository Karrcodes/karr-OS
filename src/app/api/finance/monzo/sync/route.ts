import { NextResponse } from 'next/server'
import { MonzoService } from '@/features/finance/services/MonzoService'
import { supabase } from '@/lib/supabase'

export async function POST() {
    try {
        const userId = 'karr'
        console.log(`[Sync Route] Starting sync for userId: ${userId}`)

        // Ensure webhooks are registered for real-time notifications
        try {
            await MonzoService.registerWebhooks(userId)
            console.log(`[Sync Route] Webhooks registered/checked for ${userId}`)
        } catch (webhookErr) {
            console.warn(`[Sync Route] Webhook registration failed (ignoring for now):`, webhookErr)
        }

        await MonzoService.syncPots(userId)

        console.log(`[Sync Route] Sync completed successfully for userId: ${userId}`)
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Sync Route] Monzo sync error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
