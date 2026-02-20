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
    const [isSetupMode, setIsSetupMode] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

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

    const handlePinInput = async (digit: string) => {
        if (pin.length >= 4 || isProcessing) return
        const newPin = pin + digit
        setPin(newPin)

        if (newPin.length === 4) {
            if (newPin === CORRECT_PIN) {
                if (isSetupMode) {
                    await enrollBiometrics()
                    setPin('')
                } else {
                    handleUnlock()
                }
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
            alert('Biometrics are not supported by this browser.')
            return
        }

        // WebAuthn requires HTTPS or Localhost
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        if (!isSecure) {
            alert('Biometrics (FaceID) require a secure connection (HTTPS). Testing on a mobile device usually requires a domain with SSL or using "localhost" on a computer.')
            return
        }

        // IP addresses are not valid RP IDs
        const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(window.location.hostname)
        if (isIp) {
            alert('WebAuthn (FaceID) does not work with IP addresses. Please use a domain name or localhost.')
            return
        }

        setIsProcessing(true)
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32))
            const userId = crypto.getRandomValues(new Uint8Array(16))

            // Ensure we use the proper RP ID (omit if it's not a valid domain)
            const rpId = window.location.hostname

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: "KarrOS", id: rpId },
                    user: {
                        id: userId,
                        name: "KarrUser",
                        displayName: "Karr User"
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" }, // ES256
                        { alg: -257, type: "public-key" } // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        residentKey: "preferred"
                    },
                    timeout: 60000
                }
            }) as PublicKeyCredential

            if (credential) {
                const rawId = new Uint8Array(credential.rawId)
                localStorage.setItem('karrOS_biometric_id', btoa(String.fromCharCode(...rawId)))
                setIsEnrolled(true)
                setIsSetupMode(false)
                handleUnlock()
                alert('Success! FaceID / TouchID enrolled.')
            }
        } catch (err: any) {
            console.error('Enrollment error:', err)
            if (err.name === 'NotAllowedError') {
                alert('Biometric setup timed out or was denied.')
            } else if (err.name === 'SecurityError') {
                alert('Security error: WebAuthn requires a valid domain and HTTPS.')
            } else {
                alert(`Error: ${err.message || 'Verification failed'}`)
            }
        } finally {
            setIsProcessing(false)
        }
    }

    const handleBiometric = async () => {
        if (!isEnrolled || isProcessing) {
            alert('Please enter your PIN first to setup Biometrics.')
            return
        }

        setIsProcessing(true)
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32))
            const storedId = localStorage.getItem('karrOS_biometric_id')
            if (!storedId) throw new Error('No enrolled biometrics found.')

            const credentialId = Uint8Array.from(atob(storedId), c => c.charCodeAt(0))

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
        } catch (err: any) {
            console.error('Biometric verification failed:', err)
            if (err.name !== 'NotAllowedError') {
                alert(`Biometric failed: ${err.message}`)
            }
        } finally {
            setIsProcessing(false)
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
                        {isSetupMode ? <ShieldCheck className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
                    </div>
                    <h1 className="text-[24px] font-bold text-black tracking-tight">
                        {isSetupMode ? 'Security Setup' : 'KarrOS Lock'}
                    </h1>
                    <p className="text-[14px] text-black/40 font-medium mt-1">
                        {isSetupMode ? 'Enter PIN to enroll FaceID' : 'Authorized Access Only'}
                    </p>
                </div>

                {/* PIN Display */}
                {/* ... existing PIN dots ... */}
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
                {/* ... existing Keypad ... */}

                <div className="w-full h-px bg-black/[0.05] mb-8" />

                <div className="flex flex-col gap-3 w-full">
                    {!isSetupMode ? (
                        <>
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

                            {!isEnrolled && (
                                <button
                                    onClick={() => {
                                        setIsSetupMode(true)
                                        setPin('')
                                    }}
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    + Setup FaceID / TouchID
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                setIsSetupMode(false)
                                setPin('')
                            }}
                            className="text-[13px] font-bold text-black/40 hover:text-black transition-colors"
                        >
                            Cancel Setup
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
