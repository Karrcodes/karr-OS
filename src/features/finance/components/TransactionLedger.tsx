'use client'

import { useTransactions } from '../hooks/useTransactions'
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Layers, Link2 } from 'lucide-react'
import { useBank } from '../hooks/useBank'

export function TransactionLedger() {
    const { transactions, loading, refetch } = useTransactions()
    const { syncTransactions, connectBank, loading: syncLoading } = useBank()

    const handleSync = async () => {
        try {
            const count = await syncTransactions()
            alert(`Synced ${count} new transactions!`)
            refetch()
        } catch (e: any) {
            if (e.message.includes('No active bank connection') || e.message.includes('requisition')) {
                if (confirm('No bank connection found. Would you like to connect your Revolut account now?')) {
                    connectBank()
                }
            } else {
                alert(`Sync failed: ${e.message}`)
            }
        }
    }

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-black/[0.03] rounded-xl border border-black/[0.05]" />
                ))}
            </div>
        )
    }

    const recentTransactions = transactions.slice(0, 10)

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
                        onClick={() => handleSync()}
                        className="text-[11px] font-bold text-[#7c3aed] flex items-center gap-1.5 hover:underline"
                    >
                        <Link2 className="w-3 h-3" /> Connect Bank Sync
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-wider font-bold text-black/30">Recent Ledger</h3>
                <button
                    onClick={handleSync}
                    disabled={syncLoading}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-1 rounded-lg hover:bg-[#7c3aed]/20 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${syncLoading ? 'animate-spin' : ''}`} />
                    {syncLoading ? 'Syncing...' : 'Sync Bank'}
                </button>
            </div>

            <div className="space-y-2">
                {recentTransactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-black/[0.04] bg-white hover:bg-black/[0.01] transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-black/[0.03] border border-black/[0.05] flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                            {t.emoji || '💸'}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <p className="text-[13px] font-bold text-black truncate">{t.description || 'Transaction'}</p>
                                    {t.provider === 'enable_banking' && (
                                        <span className="text-[9px] font-bold text-[#7c3aed] bg-[#7c3aed]/5 px-1 py-0.5 rounded border border-[#7c3aed]/10">BANK</span>
                                    )}
                                </div>
                                <p className={`text-[13px] font-bold ${t.type === 'spend' ? 'text-black' : 'text-[#059669]'}`}>
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
