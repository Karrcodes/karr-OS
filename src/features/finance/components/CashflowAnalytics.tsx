'use client'

import { useMemo } from 'react'
import { Activity, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { useIncome } from '../hooks/useIncome'
import { useTransactions } from '../hooks/useTransactions'

export function CashflowAnalytics() {
    const { income, loading: iLoading } = useIncome()
    const { transactions, loading: tLoading } = useTransactions()

    const { totalIncome, totalSpent, spentPercentage } = useMemo(() => {
        // Simple metric: last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentIncome = income.filter(i => new Date(i.date) >= thirtyDaysAgo)
        const recentSpend = transactions.filter(t => t.type === 'spend' && new Date(t.date) >= thirtyDaysAgo)

        const totalIncome = recentIncome.reduce((s, i) => s + i.amount, 0)
        const totalSpent = recentSpend.reduce((s, t) => s + t.amount, 0)

        const spentPercentage = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0

        return { totalIncome, totalSpent, spentPercentage }
    }, [income, transactions])

    const loading = iLoading || tLoading

    if (loading) {
        return (
            <div className="rounded-xl border border-black/[0.07] bg-white p-5 animate-pulse flex items-center justify-center min-h-[160px]">
                <Activity className="w-5 h-5 text-black/20" />
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-black/[0.07] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-[15px] font-bold text-black flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#7c3aed]" />
                        30-Day Cashflow
                    </h2>
                    <p className="text-[12px] text-black/35 mt-0.5">Income vs. Expenses</p>
                </div>
                <div className="text-right">
                    <div className="text-[20px] font-bold tracking-tight text-black">
                        £{Math.max(0, totalIncome - totalSpent).toFixed(2)}
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
                        Net Retained
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Income Bar */}
                <div>
                    <div className="flex justify-between items-end mb-1.5">
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-black/60">
                            <ArrowDownToLine className="w-3.5 h-3.5 text-[#059669]" /> Inflow
                        </div>
                        <span className="text-[14px] font-bold text-black">£{totalIncome.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 bg-black/[0.04] rounded-full overflow-hidden">
                        <div className="h-full bg-[#059669] rounded-full w-full" />
                    </div>
                </div>

                {/* Spend Bar */}
                <div>
                    <div className="flex justify-between items-end mb-1.5">
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-black/60">
                            <ArrowUpFromLine className="w-3.5 h-3.5 text-[#dc2626]" /> Outflow
                        </div>
                        <span className="text-[14px] font-bold text-black">£{totalSpent.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2 bg-black/[0.04] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#dc2626] rounded-full transition-all duration-1000"
                            style={{ width: `${spentPercentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
