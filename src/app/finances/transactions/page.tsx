'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, FileText, Search, Filter } from 'lucide-react'
import { useTransactions } from '@/features/finance/hooks/useTransactions'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'

export default function TransactionsPage() {
    const { transactions, loading } = useTransactions()
    const { activeProfile } = useFinanceProfile()
    const [search, setSearch] = useState('')

    const filtered = transactions.filter(t =>
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-black/[0.06] px-6 py-5 sticky top-0 z-20 backdrop-blur-sm shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/finances" className="w-10 h-10 rounded-xl bg-black/[0.03] flex items-center justify-center hover:bg-black/[0.06] transition-colors">
                            <ArrowLeft className="w-5 h-5 text-black/40" />
                        </a>
                        <div>
                            <h1 className="text-[20px] font-bold text-black tracking-tight">Full Ledger</h1>
                            <p className="text-[12px] text-black/35 mt-0.5">{activeProfile === 'personal' ? 'Personal' : 'Business'} · {transactions.length} total transactions</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-black/[0.03] border border-black/[0.06] rounded-xl pl-9 pr-4 py-2 text-[13px] outline-none focus:border-[#7c3aed]/30 transition-colors w-64"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-16 bg-white rounded-2xl border border-black/[0.05]" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-black/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-black/20" />
                            </div>
                            <p className="text-[15px] font-medium text-black/40">No transactions found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((t) => (
                                <div key={t.id} className="flex items-center gap-4 p-4 rounded-2xl border border-black/[0.04] bg-white hover:bg-black/[0.01] transition-colors group">
                                    <div className="w-12 h-12 rounded-2xl bg-black/[0.03] border border-black/[0.05] flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                                        {t.emoji || '💸'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[14px] font-bold text-black truncate">{t.description || 'Transaction'}</p>
                                                {t.provider === 'revolut_csv' && (
                                                    <span className="text-[9px] font-bold text-[#7c3aed] bg-[#7c3aed]/5 px-1.5 py-0.5 rounded border border-[#7c3aed]/10 tracking-widest uppercase">Sync</span>
                                                )}
                                            </div>
                                            <p className={`text-[15px] font-bold ${t.type === 'spend' ? 'text-black' : 'text-[#059669]'}`}>
                                                {t.type === 'spend' ? '-' : '+'}£{t.amount.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] uppercase font-bold tracking-wider text-black/30 bg-black/[0.03] px-1.5 py-0.5 rounded">
                                                {t.category || 'other'}
                                            </p>
                                            <span className="w-1 h-1 rounded-full bg-black/10" />
                                            <p className="text-[11px] font-medium text-black/25">
                                                {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                            {t.type === 'transfer' && (
                                                <ArrowUpRight className="w-3 h-3 text-blue-500 ml-1" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
