'use client'

import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Layers } from 'lucide-react'
import { useBank } from '../hooks/useBank'
import { usePockets } from '../hooks/usePockets'
import { TransactionDetailsModal } from './TransactionDetailsModal'
import type { Transaction } from '../types/finance.types'

export function TransactionLedger() {
    const { transactions, loading, refetch, clearTransactions } = useTransactions()
    const { pockets, loading: pocketsLoading } = usePockets()
    const { syncTransactions, startConnection, loading: bankSyncLoading } = useBank()
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

    const handleSync = async () => {
        const count = await syncTransactions()
        if (count > 0) {
            alert(`Successfully synced ${count} new transactions!`)
            refetch()
        } else if (count === 0) {
            alert('No new transactions found.')
        }
    }

    if (loading || pocketsLoading) {
        return (
            <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-black/[0.03] rounded-xl border border-black/[0.05]" />
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
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-y-2 items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-[11px] uppercase tracking-wider font-bold text-black/40">Recent Transactions</h3>
                    <span className="w-1 h-1 rounded-full bg-black/10" />
                    <a href="/finances/transactions" className="text-[10px] font-bold text-black/40 hover:text-black hover:underline transition-colors">See All</a>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={startConnection}
                        className="text-[10px] font-bold text-black/40 hover:text-black transition-colors bg-black/[0.03] px-2 py-1 rounded-lg border border-black/[0.05]"
                    >
                        Connect Bank
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={bankSyncLoading}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-black/40 hover:text-black transition-colors bg-black/[0.03] px-2 py-1 rounded-lg border border-black/[0.05] disabled:opacity-50"
                    >
                        {bankSyncLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Sync
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {recentTransactions.map((t) => {
                    const pocketName = pockets.find(p => p.id === t.pocket_id)?.name || 'General'
                    return (
                        <button
                            key={t.id}
                            onClick={() => setSelectedTx(t)}
                            className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-black/[0.04] bg-white hover:bg-black/[0.01] transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-black/[0.03] border border-black/[0.05] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden px-1">
                                <span className="text-lg leading-none" title={pocketName}>
                                    {pocketName !== 'General' ? Array.from(pocketName).pop() : (t.emoji || '💸')}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                        <p className="text-[13px] font-bold text-black truncate">{t.description || 'Transaction'}</p>
                                        {t.provider === 'enable_banking' && (
                                            <span className="text-[9px] font-bold text-black bg-black/5 px-1 py-0.5 rounded border border-black/10 flex-shrink-0">BANK</span>
                                        )}
                                        {t.provider === 'revolut_csv' && (
                                            <span className="text-[9px] font-bold text-black bg-black/5 px-1 py-0.5 rounded border border-black/10 flex-shrink-0">CSV</span>
                                        )}
                                    </div>
                                    <p className={`text-[13px] font-bold ${t.type === 'spend' ? 'text-black' : 'text-[#059669]'} privacy-blur`}>
                                        {t.type === 'spend' ? '-' : '+'}£{t.amount.toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-black/30">
                                        {t.category || 'other'}
                                    </p>
                                    <span className="w-1 h-1 rounded-full bg-black/10" />
                                    <p className="text-[10px] font-medium text-black/25">
                                        {new Date(t.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {t.type === 'transfer' && (
                                        <ArrowUpRight className="w-2.5 h-2.5 text-blue-500" />
                                    )}
                                    {t.type === 'allocate' && (
                                        <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-500" />
                                    )}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            <TransactionDetailsModal
                transaction={selectedTx}
                pockets={pockets}
                isOpen={!!selectedTx}
                onClose={() => setSelectedTx(null)}
            />
        </div>
    )
}
