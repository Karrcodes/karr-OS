'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function WaitlistPage() {
    const router = useRouter()
    const supabase = createClient()
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleRedeemCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return

        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/auth/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.trim() }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error ?? 'Something went wrong. Please try again.')
            } else {
                setSuccess(true)
                // Brief pause to show success, then redirect
                setTimeout(() => router.push('/system/control-centre'), 1500)
            }
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-5">
                        <span className="text-2xl font-bold text-white tracking-tight">Ö</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-white mb-1 tracking-tight">You&apos;re on the list</h1>
                    <p className="text-sm text-white/40">Enter an invite code to get early access</p>
                </div>

                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-sm text-green-400 font-medium">Access granted. Welcome to Schrö.</p>
                            <p className="text-xs text-white/30 mt-1">Redirecting you now...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleRedeemCode} className="space-y-3">
                            {error && (
                                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            <div>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    placeholder="INVITE CODE"
                                    maxLength={20}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm font-mono tracking-widest uppercase focus:outline-none focus:border-white/25 focus:bg-white/[0.07] transition-all"
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !code.trim()}
                                className="w-full px-4 py-3.5 bg-white text-gray-900 font-medium rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                                        Checking code...
                                    </span>
                                ) : 'Redeem Invite'}
                            </button>
                        </form>
                    )}

                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-xs text-white/25 text-center">
                            Don&apos;t have a code? You&apos;ll receive one when a spot opens up.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSignOut}
                    className="mt-4 w-full text-center text-xs text-white/20 hover:text-white/40 transition-colors"
                >
                    Sign out
                </button>
            </div>
        </div>
    )
}
