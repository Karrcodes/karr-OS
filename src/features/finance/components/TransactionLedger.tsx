'use client'

import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Layers } from 'lucide-react'
import { useBank } from '../hooks/useBank'
import { RevolutImportModal } from './RevolutImportModal'

export function TransactionLedger() {
    const { transactions, loading, refetch, clearTransactions } = useTransactions()
    const { loading: bankSyncLoading } = useBank()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleSyncSuccess = (count: number) => {
        alert(`Successfully synced ${count} new transactions!`)
        refetch()
    }

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-black/[0.03] rounded-xl border border-black/[0.05] dark:border-white/[0.05]" />
                ))}
            </div>
        )
    }

    const recentTransactions = transactions.slice(0, 5)

    if (recentTransactions.length === 0) {
        return (
            <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-3">
                    <Layers className="w-6 h-6 text-black/20" />
                </div>
                <p className="text-[13px] font-medium text-black/40">No transactions recorded yet.</p>
                <div className="flex flex-col gap-2 mt-4 items-center">
                    <p className="text-[11px] text-black/25">Use the quick action button below to log a spend.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-[11px] font-bold text-black dark:text-white flex items-center gap-1.5 hover:underline"
                    >
                        Connect Bank Sync
                    </button>
                    <RevolutImportModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSyncSuccess}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-[11px] uppercase tracking-wider font-bold text-black/30">Recent Ledger</h3>
                    <a href="/finances/transactions" className="text-[10px] font-bold text-black dark:text-white hover:underline">See All</a>
                    <button
                        onClick={() => { if (confirm('Clear all transactions in this profile?')) clearTransactions() }}
                        className="text-[10px] font-bold text-red-400/60 hover:text-red-500 transition-colors ml-2"
                    >
                        Clear Ledger
                    </button>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={bankSyncLoading}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-black dark:text-white bg-black/10 dark:bg-white dark:bg-[#0a0a0a]/10 px-2 py-1 rounded-lg hover:bg-black/20 dark:bg-white dark:bg-[#0a0a0a]/20 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${bankSyncLoading ? 'animate-spin' : ''}`} />
                    {bankSyncLoading ? 'Syncing...' : 'Sync Bank'}
                </button>
                <RevolutImportModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSyncSuccess}
                />
            </div>

            <div className="space-y-2">
                {recentTransactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.04] bg-white dark:bg-[#0a0a0a] hover:bg-black/[0.01] dark:bg-white/[0.01] transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-black/[0.03] border border-black/[0.05] dark:border-white/[0.05] flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                            {t.emoji || '💸'}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-bold text-black dark:text-white truncate">{t.description || 'Transaction'}</p>
                                    {t.provider === 'enable_banking' && (
                                        <span className="text-[9px] font-bold text-black dark:text-white bg-black/5 dark:bg-white dark:bg-[#0a0a0a]/5 px-1 py-0.5 rounded border border-black/10 dark:border-white/10">BANK</span>
                                    )}
                                </div>
                                <p className={`text-[13px] font-bold ${t.type === 'spend' ? 'text-black dark:text-white' : 'text-[#059669]'}`}>
                                    {t.type === 'spend' ? '-' : '+'}£{t.amount.toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] uppercase font-bold tracking-wider text-black/30">
                                    {t.category || 'other'}
                                </p>
                                <span className="w-1 h-1 rounded-full bg-black/10" />
                                <p className="text-[10px] font-medium text-black/25">
                                    {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </p>
                                {t.type === 'transfer' && (
                                    <ArrowUpRight className="w-2.5 h-2.5 text-blue-500" />
                                )}
                                {t.type === 'allocate' && (
                                    <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-500" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
