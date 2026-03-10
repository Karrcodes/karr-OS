'use client'

import React, { useState } from 'react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { Activity, X, Lock, MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const LOCATIONS = [
    { id: '123', name: 'Cardiff City' },
    { id: '456', name: 'Cardiff Queen St' },
    { id: '789', name: 'Newport Road' }
]

export function GymConnectionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { connectGym } = useWellbeing()
    const [email, setEmail] = useState('')
    const [pin, setPin] = useState('')
    const [locationId, setLocationId] = useState(LOCATIONS[0].id)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        setError('')

        try {
            await connectGym(email, pin, locationId)
            setStatus('success')
            setTimeout(onClose, 1500)
        } catch (err: any) {
            setStatus('error')
            setError(err.message || 'Authentication failed. Please check your credentials.')
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[40px] p-10 z-[1000] shadow-2xl border border-black/5"
                    >
                        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-black/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-black/20" />
                        </button>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                                    <Activity className="w-6 h-6 text-emerald-500" />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Link Gym Account</h2>
                                <p className="text-[13px] font-medium text-black/40 leading-relaxed uppercase tracking-tight">
                                    Synchronize your Cardiff City gym activity to track visits and intensity automatically.
                                </p>
                            </div>

                            {status === 'success' ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-10 space-y-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 className="w-8 h-8 text-white" />
                                    </div>
                                    <p className="text-[12px] font-black uppercase tracking-widest text-emerald-600">Protocol Synchronized</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input
                                                type="email"
                                                required
                                                placeholder="EMAIL ADDRESS"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-6 py-4 text-[13px] font-bold placeholder:text-black/20 focus:outline-none focus:ring-1 focus:ring-black uppercase tracking-wider"
                                            />
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                required
                                                placeholder="LOGIN PIN"
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value)}
                                                className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-6 py-4 text-[13px] font-bold placeholder:text-black/20 focus:outline-none focus:ring-1 focus:ring-black uppercase tracking-wider"
                                            />
                                            <Lock className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/10" />
                                        </div>
                                        <div className="relative">
                                            <select
                                                value={locationId}
                                                onChange={(e) => setLocationId(e.target.value)}
                                                className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-6 py-4 text-[13px] font-bold focus:outline-none focus:ring-1 focus:ring-black uppercase tracking-wider appearance-none"
                                            >
                                                {LOCATIONS.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                ))}
                                            </select>
                                            <MapPin className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-black/10 pointer-events-none" />
                                        </div>
                                    </div>

                                    {status === 'error' && (
                                        <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className={cn(
                                            "w-full py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3",
                                            status === 'loading' ? "bg-black/20 text-black/40 cursor-wait" : "bg-black text-white hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-black/10"
                                        )}
                                    >
                                        {status === 'loading' ? (
                                            <>
                                                Authenticating...
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            </>
                                        ) : 'Establish Connection'}
                                    </button>
                                </form>
                            )}

                            <p className="text-[10px] font-medium text-black/20 text-center uppercase tracking-widest leading-relaxed">
                                Credentials are used only to establish a secure bridge between Schrö and The Gym Group. We do not store your plain-text PIN.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
