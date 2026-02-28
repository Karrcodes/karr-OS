import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with Service Role
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function sendPushNotification(title: string, body: string, url: string = '/') {
    try {
        console.log('Sending push notification:', { title, body, url });

        // 1. Atomic Deduplication Check & Logging
        const { data: canNotify, error: gateError } = await supabase.rpc('log_and_gate_notification', {
            p_title: title,
            p_body: body,
            p_url: url,
            p_cooldown_seconds: 5
        })

        if (gateError) {
            console.error('[PushServer] Gating error:', gateError);
            // Fallback: Continue if database error to ensure user gets notification, but log it
        }

        if (canNotify === false) {
            console.log('[PushServer] Duplicate notification blocked by atomic cooldown');
            await supabase.from('sys_notification_logs').insert({
                title: 'DEBUG: Push Suppressed',
                body: `Cooldown active for: ${title}`
            })
            return { success: true, message: 'Duplicate suppressed' }
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const privateKey = process.env.VAPID_PRIVATE_KEY;

        if (!publicKey || !privateKey) {
            console.error('VAPID keys missing - skipping push notification');
            return { success: false, error: 'VAPID keys missing' };
        }

        webpush.setVapidDetails(
            'mailto:karr@studiokarrtesian.com',
            publicKey,
            privateKey
        )

        // Fetch all subscriptions for 'karr'
        const { data: subs, error } = await supabase
            .from('sys_push_subscriptions')
            .select('id, subscription')
            .eq('user_id', 'karr')

        if (error) throw error
        const payload = {
            title,
            body,
            url,
            icon: '/app-icon.png',
            badge: '/app-icon.png'
        }

        console.log(`[PushServer] Found ${subs?.length || 0} subscriptions for user: karr`)

        const results = await Promise.all((subs || []).map(async (sub: any) => {
            try {
                await webpush.sendNotification(
                    sub.subscription as any,
                    JSON.stringify(payload),
                    {
                        vapidDetails: {
                            subject: 'mailto:karr@karrtesian.com',
                            publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
                            privateKey: process.env.VAPID_PRIVATE_KEY!
                        }
                    }
                )

                await supabase.from('sys_notification_logs').insert({
                    title: `SUCCESS: Push Sent`,
                    body: `To: ${sub.subscription?.endpoint?.slice(-20)}... Payload: ${title}`
                })

                return { endpoint: sub.subscription?.endpoint, success: true }
            } catch (error: any) {
                console.error('Error sending push to endpoint:', sub.subscription?.endpoint, error.statusCode)

                await supabase.from('sys_notification_logs').insert({
                    title: `ERROR: Push Failed (${error.statusCode || 'N/A'})`,
                    body: `Endpoint: ${sub.subscription?.endpoint?.slice(-20)}... Error: ${error.message}`
                })

                // Delete stale subscriptions
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await supabase.from('sys_push_subscriptions').delete().eq('id', sub.id)
                }
                return { endpoint: sub.subscription?.endpoint, success: false, error: error.message }
            }
        }))

        return {
            success: true,
            results,
            subscriptionCount: (subs || []).length
        }
    } catch (error: any) {
        console.error('Fatal error in sendPushNotification:', error)
        await supabase.from('sys_notification_logs').insert({
            title: 'FATAL: sendPushNotification Crash',
            body: error.message
        })
        return { success: false, message: error.message }
    }
}
