'use client'

import React from 'react'
import { Trash2, AlertCircle, Info, X } from 'lucide-react'
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
            <div className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col p-8 text-center animate-in zoom-in-95 duration-200 font-outfit">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-1 rounded-full hover:bg-black/5 text-black/20 hover:text-black transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
                    type === 'danger' ? "bg-red-50 text-red-600 shadow-inner" :
                        type === 'warning' ? "bg-amber-50 text-amber-600 shadow-inner" :
                            "bg-blue-50 text-blue-600 shadow-inner"
                )}>
                    <Icon className="w-10 h-10" />
                </div>

                <h3 className="text-xl font-black text-black mb-3 tracking-tight">{title}</h3>
                <p className="text-[15px] font-medium text-black/50 mb-8 leading-relaxed px-2">
                    {message}
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-4 rounded-2xl border border-black/[0.08] text-black/40 font-black text-[13px] uppercase tracking-widest hover:bg-black/[0.02] transition-all disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={async () => {
                            await onConfirm()
                            onClose()
                        }}
                        disabled={loading}
                        className={cn(
                            "flex-1 py-4 rounded-2xl text-white font-black text-[13px] uppercase tracking-widest transition-all shadow-xl disabled:opacity-50",
                            type === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-200" :
                                type === 'warning' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" :
                                    "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                        )}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
