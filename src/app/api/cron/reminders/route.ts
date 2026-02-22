import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushNotification } from '@/lib/push-server'

/**
 * Vercel Cron job to send lifestyle reminders.
 * Scheduled to run daily (configure in vercel.json)
 */
export async function GET(req: Request) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch settings
        const { data: settingsData, error: fetchError } = await supabase
            .from('sys_settings')
            .select('*')
            .in('key', ['off_days', 'last_reminder_sent'])

        if (fetchError) throw fetchError

        const settings: Record<string, string> = {}
        settingsData?.forEach(item => settings[item.key] = item.value)

        const offDays = JSON.parse(settings.off_days || '[]')
        const lastSent = settings.last_reminder_sent || ''

        // Get today's name (e.g., "Monday")
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
        const todayDate = new Date().toISOString().split('T')[0]

        console.log(`Cron checking: Today is ${todayName}. Off-days:`, offDays)

        // 2. Determine if we should send a reminder
        // Rule: If today is the FIRST day in the off_days array, it's the start of the weekend.
        const isFirstOffDay = offDays.length > 0 && offDays[0] === todayName
        const alreadySentToday = lastSent === todayDate

        if (isFirstOffDay && !alreadySentToday) {
            console.log('Target hit! Sending finance review reminder...')

            const { success, error } = await sendPushNotification(
                '🏝️ Weekend Hub',
                'Ready for your check-in? It\'s the first day of your off-days. Time to review your fiances!',
                '/finances'
            )

            if (!success) {
                console.error('Failed to send cron push notification:', error)
                return NextResponse.json({ error: 'Push failed' }, { status: 500 })
            }

            // 3. Mark as sent to prevent duplicate triggers
            const { error: upsertError } = await supabase
                .from('sys_settings')
                .upsert({
                    key: 'last_reminder_sent',
                    value: todayDate,
                    updated_at: new Date().toISOString()
                })

            if (upsertError) console.error('Failed to update last_reminder_sent:', upsertError)

            return NextResponse.json({ success: true, message: 'Reminder sent successfully' })
        }

        return NextResponse.json({
            success: true,
            message: isFirstOffDay ? 'Already sent today' : 'Not a reminder day'
        })

    } catch (error: any) {
        console.error('CRON Route Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
