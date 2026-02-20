'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Finalizing your bank connection...')

    useEffect(() => {
        const finalize = async () => {
            const code = searchParams.get('code')
            const state = searchParams.get('state')

            if (!code) {
                setStatus('error')
                setMessage('Missing authorization code from bank.')
                return
            }

            try {
                const res = await fetch(`/api/finance/bank/callback?code=${code}&state=${state || ''}`)
                const data = await res.json()

                if (data.success) {
                    setStatus('success')
                    setMessage('Bank successfully linked! Redirecting...')
                    setTimeout(() => router.push('/finances'), 2000)
                } else {
                    throw new Error(data.error || 'Failed to verify connection')
                }
            } catch (error: any) {
                setStatus('error')
                setMessage(error.message || 'An error occurred during finalization.')
            }
        }

        finalize()
    }, [searchParams, router])

    return (
        <div className="w-full max-w-sm space-y-6">
            {status === 'loading' && (
                <>
                    <Loader2 className="w-12 h-12 text-black dark:text-white animate-spin mx-auto" />
                    <h1 className="text-xl font-bold text-black">Linking Account</h1>
                    <p className="text-black/40">{message}</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h1 className="text-xl font-bold text-black">Success!</h1>
                    <p className="text-black/40">{message}</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h1 className="text-xl font-bold text-black">Connection Failed</h1>
                    <p className="text-black/40">{message}</p>
                    <button
                        onClick={() => router.push('/finances')}
                        className="btn-secondary w-full"
                    >
                        Back to Finances
                    </button>
                </>
            )}
        </div>
    )
}

export default function BankCallback() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <Suspense fallback={<Loader2 className="w-12 h-12 text-black dark:text-white animate-spin mx-auto" />}>
                <CallbackContent />
            </Suspense>
        </div>
    )
}
