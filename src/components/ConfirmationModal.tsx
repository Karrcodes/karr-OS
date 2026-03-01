'use client'

import React from 'react'
import { Trash2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmationModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void> | void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
    loading?: boolean
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Back',
    type = 'danger',
    loading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null

    const Icon = type === 'danger' ? Trash2 : type === 'warning' ? AlertCircle : Info

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 text-center animate-in zoom-in-95 duration-200">
                <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                    type === 'danger' ? "bg-red-100 text-red-600" :
                        type === 'warning' ? "bg-amber-100 text-amber-600" :
                            "bg-emerald-100 text-emerald-600"
                )}>
                    <Icon className="w-8 h-8" />
                </div>

                <h3 className="text-lg font-bold text-black mb-2">{title}</h3>
                <p className="text-[14px] text-black/60 mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl border border-black/[0.1] text-black/60 font-bold text-[14px] hover:bg-black/[0.05] transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                await onConfirm()
                                onClose()
                            } catch (err) {
                                // Error handled by onConfirm or ignored here
                            }
                        }}
                        disabled={loading}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-white font-bold text-[14px] transition-colors shadow-lg disabled:opacity-50",
                            type === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-200" :
                                type === 'warning' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200" :
                                    "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                        )}
                    >
                        {loading ? '...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
