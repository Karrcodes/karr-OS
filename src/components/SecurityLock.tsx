'use client'

import { useState, useEffect } from 'react'
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const CORRECT_PIN = '7276'

export function SecurityLock({ children }: { children: React.ReactNode }) {
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [pin, setPin] = useState('')
    const [error, setError] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const unlocked = sessionStorage.getItem('karrOS_unlocked')
        if (unlocked === 'true') {
            setIsUnlocked(true)
        }

        // Check if biometric is enrolled
        const credentialId = localStorage.getItem('karrOS_biometric_id')
        if (credentialId) {
            setIsEnrolled(true)
        }
    }, [])

    const handlePinInput = (digit: string) => {
        if (pin.length >= 4) return
        const newPin = pin + digit
        setPin(newPin)

        if (newPin.length === 4) {
            if (newPin === CORRECT_PIN) {
                handleUnlock()
            } else {
                setError(true)
                setTimeout(() => {
                    setPin('')
                    setError(false)
                }, 500)
            }
        }
    }

    const handleUnlock = () => {
        setIsUnlocked(true)
        sessionStorage.setItem('karrOS_unlocked', 'true')
    }

    const enrollBiometrics = async () => {
        if (!window.PublicKeyCredential) {
            alert('Biometrics not supported on this browser.')
            return
        }

        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32))
            const userId = crypto.getRandomValues(new Uint8Array(16))

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: "KarrOS", id: window.location.hostname },
                    user: {
                        id: userId,
                        name: "Karr User",
                        displayName: "Karr User"
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    },
                    timeout: 60000
                }
            }) as PublicKeyCredential

            if (credential) {
                // Store the credential ID to prove setup
                localStorage.setItem('karrOS_biometric_id', btoa(String.fromCharCode(...new Uint8Array(credential.rawId))))
                setIsEnrolled(true)
                alert('FaceID / Biometrics enrolled successfully!')
            }
        } catch (err) {
            console.error('Enrollment failed:', err)
            alert('Setup failed. Ensure you are on a secure (HTTPS or localhost) connection and try again.')
        }
    }

    const handleBiometric = async () => {
        if (!isEnrolled) {
            alert('Please enter your PIN first to setup Biometrics.')
            return
        }

        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32))
            const credentialId = Uint8Array.from(atob(localStorage.getItem('karrOS_biometric_id')!), c => c.charCodeAt(0))

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    allowCredentials: [{
                        id: credentialId,
                        type: 'public-key'
                    }],
                    userVerification: "required",
                    timeout: 60000
                }
            })

            if (assertion) {
                handleUnlock()
            }
        } catch (err) {
            console.error('Biometric verification failed:', err)
            // If it's a "not found" or "canceled" error, show a less scary message
        }
    }

    if (!isMounted) return null
    if (isUnlocked) return <>{children}</>

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
            {/* Background elements for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#fafafa] to-white" />
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-black/[0.02] rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-black/[0.01] rounded-full blur-3xl" />

            <div className="relative w-full max-w-[320px] px-6 flex flex-col items-center">
                <div className="mb-12 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mb-6 shadow-2xl shadow-black/20">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-[24px] font-bold text-black tracking-tight">KarrOS Lock</h1>
                    <p className="text-[14px] text-black/40 font-medium mt-1">Authorized Access Only</p>
                </div>

                {/* PIN Display */}
                <div className="flex gap-4 mb-12">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${error
                                ? 'bg-red-500 border-red-500 scale-110'
                                : pin.length > i
                                    ? 'bg-black border-black scale-110'
                                    : 'bg-transparent border-black/10'
                                }`}
                        />
                    ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4 w-full mb-8">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                        <button
                            key={num}
                            onClick={() => handlePinInput(num)}
                            className="aspect-square rounded-full flex flex-col items-center justify-center hover:bg-black/[0.03] active:bg-black/[0.08] active:scale-95 transition-all outline-none"
                        >
                            <span className="text-[20px] font-bold text-black">{num}</span>
                            <span className="text-[9px] font-bold text-black/20 tracking-widest mt-0.5">
                                {num === '2' && 'ABC'}
                                {num === '3' && 'DEF'}
                                {num === '4' && 'GHI'}
                                {num === '5' && 'JKL'}
                                {num === '6' && 'MNO'}
                                {num === '7' && 'PQRS'}
                                {num === '8' && 'TUV'}
                                {num === '9' && 'WXYZ'}
                            </span>
                        </button>
                    ))}
                    <div />
                    <button
                        onClick={() => handlePinInput('0')}
                        className="aspect-square rounded-full flex items-center justify-center hover:bg-black/[0.03] active:bg-black/[0.08] active:scale-95 transition-all outline-none"
                    >
                        <span className="text-[20px] font-bold text-black">0</span>
                    </button>
                    <button
                        onClick={() => setPin(pin.slice(0, -1))}
                        className="aspect-square rounded-full flex items-center justify-center text-black/30 hover:text-black hover:bg-black/[0.03] active:scale-95 transition-all outline-none text-[11px] font-bold"
                    >
                        DEL
                    </button>
                </div>

                <div className="w-full h-px bg-black/[0.05] mb-8" />

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={handleBiometric}
                        className={cn(
                            "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all group active:scale-95 w-full",
                            isEnrolled
                                ? "bg-black text-white hover:bg-neutral-800"
                                : "bg-black/5 text-black/20 cursor-not-allowed"
                        )}
                        disabled={!isEnrolled}
                    >
                        <Fingerprint className="w-5 h-5" />
                        <span className="text-[13px] font-bold tracking-tight">Use Biometrics</span>
                    </button>

                    {!isEnrolled && pin === CORRECT_PIN && (
                        <button
                            onClick={enrollBiometrics}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors animate-pulse"
                        >
                            + Setup FaceID / TouchID
                        </button>
                    )}
                </div>

                <p className="mt-8 text-[11px] font-bold text-black/20 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    Encrypted Session
                </p>
            </div>
        </div>
    )
}
