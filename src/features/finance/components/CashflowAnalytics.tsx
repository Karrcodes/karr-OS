'use client'

import { useState, useMemo } from 'react'
import { Activity, ArrowDownToLine, ArrowUpFromLine, BarChart2 } from 'lucide-react'
import { InfoTooltip } from './InfoTooltip'
import { useIncome } from '../hooks/useIncome'
import { useTransactions } from '../hooks/useTransactions'

export function CashflowAnalytics() {
    const { transactions, loading: tLoading } = useTransactions()
    const [view, setView] = useState<'30d' | 'all-time'>('30d')

    const { totalIncome, totalSpent, spentPercentage } = useMemo(() => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentInflow = transactions.filter(t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo)
        const recentSpend = transactions.filter(t => t.type === 'spend' && new Date(t.date) >= thirtyDaysAgo)

        const totalIncome = recentInflow.reduce((s, i) => s + i.amount, 0)
        const totalSpent = recentSpend.reduce((s, t) => s + t.amount, 0)

        const spentPercentage = totalIncome > 0 ? Math.min((totalSpent / totalIncome) * 100, 100) : 0

        return { totalIncome, totalSpent, spentPercentage }
    }, [transactions])

    const { allTimeEarned, monthlyData, maxMonthly } = useMemo(() => {
        let total = 0
        const groups: { [monthStr: string]: { amount: number, sortKey: string } } = {}

        // Only count salary transfers ("Payment from U U K") as true income
        const salaryTransactions = transactions.filter(t =>
            t.type === 'income' &&
            t.description?.toLowerCase().includes('payment from u u k')
        )

        salaryTransactions.forEach(i => {
            total += i.amount
            const date = new Date(i.date)
            const monthStr = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
            const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

            if (!groups[monthStr]) groups[monthStr] = { amount: 0, sortKey }
            groups[monthStr].amount += i.amount
        })

        const sorted = Object.entries(groups)
            .map(([month, data]) => ({ month, amount: data.amount, sortKey: data.sortKey }))
            .sort((a, b) => a.sortKey.localeCompare(b.sortKey))

        const max = Math.max(...sorted.map(d => d.amount), 1)

        return { allTimeEarned: total, monthlyData: sorted, maxMonthly: max }
    }, [transactions])

    const loading = tLoading

    if (loading) {
        return (
            <div className="rounded-xl border border-black/[0.07] bg-white p-5 animate-pulse flex items-center justify-center min-h-[160px]">
                <Activity className="w-5 h-5 text-black/20" />
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-black/[0.07] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h2 className="text-[15px] font-bold text-black flex items-center gap-2">
                        {view === '30d' ? <Activity className="w-4 h-4 text-black" /> : <BarChart2 className="w-4 h-4 text-[#059669]" />}
                        {view === '30d' ? 'Cashflow' : 'Historical Income'}
                    </h2>
                    <p className="text-[12px] text-black/35 mt-0.5">
                        {view === '30d' ? 'Sync-based Inflow vs. Expenses' : 'Historical Income Analysis'}
                    </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-black/[0.04] rounded-lg p-0.5">
                        <button
                            onClick={() => setView('30d')}
                            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${view === '30d' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                        >
                            30d
                        </button>
                        <button
                            onClick={() => setView('all-time')}
                            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${view === 'all-time' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black/60'}`}
                        >
                            All Time
                        </button>
                    </div>
                    {view === '30d' ? (
                        <>
                            <div className="text-[20px] font-bold tracking-tight text-black mt-1">
                                £{Math.max(0, totalIncome - totalSpent).toFixed(2)}
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[11px] font-semibold uppercase tracking-wider text-black/40">
                                Net Retained
                                <InfoTooltip content={'Inflow minus Outflow over the last 30 days, based on transactions tagged as "income" and "spend". Never goes below £0.'} side="left" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-[20px] font-bold tracking-tight text-[#059669] mt-1">
                                £{allTimeEarned.toFixed(2)}
                            </div>
                            <div className="flex items-center justify-end gap-1 text-[11px] font-semibold uppercase tracking-wider text-black/40">
                                Total Earnings
                                <InfoTooltip content={'Only counts transactions with description "Payment from U U K" — your salary transfer from your employer to Revolut.'} side="left" />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {view === '30d' ? (
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
            ) : (
                <div className="pt-2">
                    {monthlyData.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-[12px] text-black/40">No income data yet.</div>
                    ) : (
                        <div className="flex items-end gap-1.5 h-32">
                            {monthlyData.slice(-6).map((d) => (
                                <div key={d.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <div
                                        className="w-full max-w-[40px] bg-[#059669]/10 rounded-t-sm relative hover:bg-[#059669]/30 transition-colors min-h-[4px]"
                                        style={{ height: `${(d.amount / maxMonthly) * 100}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                            £{d.amount.toFixed(2)}
                                        </div>
                                    </div>
                                    <span className="text-[9px] uppercase font-bold text-black/40 tracking-wider text-center">{d.month.split(' ')[0]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
