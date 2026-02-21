'use client'

import { X, Layers, Tag, Calendar, Hash, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import type { Transaction, Pocket } from '../types/finance.types'

interface TransactionDetailsModalProps {
    transaction: Transaction | null
    pockets: Pocket[]
    isOpen: boolean
    onClose: () => void
}

export function TransactionDetailsModal({ transaction, pockets, isOpen, onClose }: TransactionDetailsModalProps) {
    if (!isOpen || !transaction) return null

    const pocketName = pockets.find(p => p.id === transaction.pocket_id)?.name || 'General'

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pointer-events-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                >
                    <X className="w-4 h-4 text-black/60" />
                </button>

                <div className="pr-10 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-black/[0.03] border border-black/[0.05] flex items-center justify-center text-2xl shrink-0 shadow-sm">
                            {pocketName !== 'General' ? Array.from(pocketName).pop() : (transaction.emoji || '💸')}
                        </div>
                        <div>
                            <h2 className="text-[18px] font-bold text-black leading-tight">{transaction.description || 'Transaction'}</h2>
                            <p className={`text-[15px] font-black ${transaction.type === 'spend' ? 'text-black' : 'text-emerald-600'}`}>
                                {transaction.type === 'spend' ? '-' : '+'}£{transaction.amount.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                        <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4 text-black/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-black/40 mb-0.5">Budget Pocket</p>
                            <p className="text-[14px] font-semibold text-black truncate">{pocketName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                        <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4 text-black/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-black/40 mb-0.5">Resolved Category</p>
                            <div className="flex items-center gap-2">
                                <p className="text-[14px] font-semibold text-black capitalize">{transaction.category || 'Other'}</p>
                                <span className="text-[9px] font-bold text-black/40 bg-black/5 px-1.5 py-0.5 rounded border border-black/10 tracking-widest uppercase">AI Deduced</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                            <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-black/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-black/40 mb-0.5">Date</p>
                                <p className="text-[13px] font-semibold text-black truncate">
                                    {new Date(transaction.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                            <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                                {transaction.type === 'transfer' ? <ArrowUpRight className="w-4 h-4 text-blue-500" /> :
                                    transaction.type === 'allocate' ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> :
                                        <Hash className="w-4 h-4 text-black/50" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-black/40 mb-0.5">Type</p>
                                <p className="text-[13px] font-semibold text-black capitalize truncate">{transaction.type}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-black/5 flex justify-end">
                    {transaction.provider && (
                        <p className="text-[10px] uppercase tracking-wider font-bold text-black/30">
                            Source: {transaction.provider.replace('_', ' ')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
