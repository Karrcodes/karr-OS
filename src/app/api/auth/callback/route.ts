import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/system/control-centre'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.user) {
            const user = data.user

            // Check if user_profile exists, create if not
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select('id, status')
                .eq('id', user.id)
                .single()

            if (!existingProfile) {
                // Determine initial status — check if this is the admin email
                const adminEmail = process.env.ADMIN_EMAIL
                const status = adminEmail && user.email === adminEmail ? 'admin' : 'waitlist'

                await supabase.from('user_profiles').insert({
                    id: user.id,
                    email: user.email,
                    display_name: user.user_metadata?.full_name ?? user.email,
                    avatar_url: user.user_metadata?.avatar_url ?? null,
                    status,
                    modules_enabled: {
                        finance: status === 'admin',
                        studio: status === 'admin',
                        goals: status === 'admin',
                        vault: status === 'admin',
                        intelligence: status === 'admin',
                    },
                })

                // If admin, go directly to app
                if (status === 'admin') {
                    return NextResponse.redirect(`${origin}${next}`)
                }

                // Otherwise send to waitlist
                return NextResponse.redirect(`${origin}/waitlist`)
            }

            // Profile exists — check approval status
            if (existingProfile.status === 'waitlist') {
                return NextResponse.redirect(`${origin}/waitlist`)
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Auth error — redirect to login with error flag
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
