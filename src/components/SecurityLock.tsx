'use client'

import { useState, useEffect } from 'react'
import { Lock, Fingerprint, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const CORRECT_PIN = '7276'

export function SecurityLock({ children }: { children: React.ReactNode }) {
    // TEMPORARY BYPASS FOR LOCAL DEVICE TESTING
    return <>{children}</>

    const [isUnlocked, setIsUnlocked] = useState(false)
    const [pin, setPin] = useState('')
    const [error, setError] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [isEnrolled, setIsEnrolled] = useState(false)
    const [isSetupMode, setIsSetupMode] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [shieldId, setShieldId] = useState<string>('')

    useEffect(() => {
        setIsMounted(true)

        // Handle Shield ID (Hardware Fingerprint)
        let sid = localStorage.getItem('karrOS_shield_id')
        if (!sid) {
            sid = crypto.randomUUID()
            localStorage.setItem('karrOS_shield_id', sid)
        }
        setShieldId(sid)

        // Initial Authorization Check
        checkAuthorization(sid)

        const unlocked = localStorage.getItem('karrOS_unlocked')
        if (unlocked === 'true') {
            setIsUnlocked(true)
        }

        // Check if biometric is enrolled
        const credentialId = localStorage.getItem('karrOS_biometric_id')
        if (credentialId) {
            setIsEnrolled(true)
        }
    }, [])

    const checkAuthorization = async (sid: string) => {
        try {
            const { data, error } = await supabase
                .from('fin_authorized_devices')
                .select('*')
                .eq('device_id', sid)
                .single()

            if (data) {
                setIsAuthorized(true)
                // Update last used timestamp
                await supabase
                    .from('fin_authorized_devices')
                    .update({ last_used_at: new Date().toISOString() }) // Dummy update to trigger timestamp if needed or use actual update
                    .eq('device_id', sid)
            } else {
                setIsAuthorized(false)
            }
        } catch (err) {
            console.error('Auth check error:', err)
            setIsAuthorized(false)
        }
    }

    const authorizeCurrentDevice = async () => {
        if (pin !== CORRECT_PIN) return

        setIsProcessing(true)
        try {
            // Check current count
            const { count } = await supabase
                .from('fin_authorized_devices')
                .select('*', { count: 'exact', head: true })

            if (count !== null && count >= 3) {
                alert('Maximum device limit (3) reached. Please revoke an old device from Settings.')
                setIsProcessing(false)
                return
            }

            const deviceName = `${typeof window !== 'undefined' ? window.navigator.userAgent.split(')')[0].split('(')[1] : 'Unknown Device'}`

            const { error } = await supabase
                .from('fin_authorized_devices')
                .insert({
                    device_id: shieldId,
                    device_name: deviceName
                })

            if (error) throw error

            setIsAuthorized(true)
            handleUnlock() // Now it's safe to unlock!
            alert('Device Authorized Successfully!')
        } catch (err: any) {
            console.error('Authorization failed:', err)
            alert('Authorization failed. Ensure you have run the database migration.')
        } finally {
            setIsProcessing(false)
            setPin('')
        }
    }

    const handlePinInput = async (digit: string) => {
        if (pin.length >= 4 || isProcessing) return
        const newPin = pin + digit
        setPin(newPin)

        if (newPin.length === 4) {
            if (newPin === CORRECT_PIN) {
                if (isSetupMode) {
                    await enrollBiometrics()
                    setPin('')
                } else if (isAuthorized === false) {
                    // STOP: Don't auto-unlock if the device is unauthorized.
                    // The user must explicitly click "Authorize This Device"
                    console.log('PIN correct, awaiting explicit authorization click.')
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
        localStorage.setItem('karrOS_unlocked', 'true')
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
                    rp: { name: "Schrö", id: rpId },
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
    if (isUnlocked && isAuthorized !== false) return <>{children}</>

    const showUnauthorized = isAuthorized === false

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
            {/* Background elements for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#fafafa] to-white" />

            <div className="relative w-full max-w-[320px] px-6 flex flex-col items-center text-center">
                <div className="mb-12 flex flex-col items-center">
                    <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-all duration-500",
                        showUnauthorized
                            ? "bg-red-500 shadow-red-500/20 animate-pulse"
                            : isSetupMode
                                ? "bg-blue-600 shadow-blue-500/20"
                                : "bg-black shadow-black/20"
                    )}>
                        {showUnauthorized ? <ShieldCheck className="w-8 h-8 text-white" /> : isSetupMode ? <ShieldCheck className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
                    </div>
                    <h1 className="text-[24px] font-bold text-black tracking-tight">
                        {showUnauthorized ? 'Hardware Block' : isSetupMode ? 'Security Setup' : 'Schrö Lock'}
                    </h1>
                    <p className="text-[14px] text-black/40 font-medium mt-1">
                        {showUnauthorized
                            ? 'This device is not authorized.'
                            : isSetupMode
                                ? 'Enter PIN to enroll FaceID'
                                : 'Authorized Access Only'}
                    </p>
                </div>

                {/* PIN Display */}
                <div className="flex gap-4 mb-12">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${error
                                ? 'bg-red-500 border-red-500 scale-110'
                                : pin.length > i
                                    ? (showUnauthorized ? 'bg-red-500 border-red-500' : 'bg-black border-black') + ' scale-110'
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
                    {showUnauthorized ? (
                        <button
                            onClick={authorizeCurrentDevice}
                            disabled={pin !== CORRECT_PIN || isProcessing}
                            className={cn(
                                "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl transition-all active:scale-95 w-full font-bold text-[13px]",
                                pin === CORRECT_PIN
                                    ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                                    : "bg-black/5 text-black/20"
                            )}
                        >
                            {isProcessing ? 'Authorizing...' : 'Authorize This Device'}
                        </button>
                    ) : !isSetupMode ? (
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
                    Secure Shield ID: {shieldId.slice(0, 8)}...
                </p>
            </div>
        </div>
    )
}
