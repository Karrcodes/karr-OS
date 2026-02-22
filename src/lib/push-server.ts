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
            .select('subscription')
            .eq('user_id', 'karr')

        if (error) throw error
        if (!subs || subs.length === 0) return { success: true, message: 'No subscriptions found' }

        const results = await Promise.all(subs.map(async (s) => {
            try {
                await webpush.sendNotification(
                    s.subscription as any,
                    JSON.stringify({ title, body, url })
                )
                return { success: true }
            } catch (e: any) {
                console.error('Error sending push:', e.statusCode, e.endpoint)
                // Remove expired subscriptions
                if (e.statusCode === 404 || e.statusCode === 410) {
                    await supabase
                        .from('sys_push_subscriptions')
                        .delete()
                        .match({ 'subscription->>endpoint': e.endpoint })
                }
                return { success: false, error: e.message }
            }
        }))

        return { success: true, results }
    } catch (error: any) {
        console.error('Global push send error:', error)
        return { success: false, error: error.message }
    }
}
