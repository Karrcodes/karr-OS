'use client'

import { useMemo, useState, useEffect } from 'react'
import { DollarSign, TrendingDown, Wallet, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { InfoTooltip } from './InfoTooltip'
import { countRemainingPayments, addMonths } from '../utils/lenderLogos'
import { usePockets } from '../hooks/usePockets'
import { useRecurring } from '../hooks/useRecurring'
import { useGoals } from '../hooks/useGoals'
import { useTransactions } from '../hooks/useTransactions'
import { PocketsGrid } from './PocketsGrid'
import { CalendarVisualizer } from './CalendarVisualizer'
import { GoalsList } from './GoalsList'
import { KarrAIChat } from './KarrAIChat'
import { QuickActionFAB } from './QuickActionFAB'
import { CashflowAnalytics } from './CashflowAnalytics'
import { TransactionLedger } from './TransactionLedger'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function CommandCenter() {
    const { pockets, loading: pLoading, refetch: refetchPockets } = usePockets()
    const { obligations, loading: oLoading } = useRecurring()
    const { goals, loading: gLoading, refetch: refetchGoals } = useGoals()
    const { refetch: refetchTransactions } = useTransactions()
    const { activeProfile, setProfile, isPrivacyEnabled, togglePrivacy } = useFinanceProfile()

    const summary = useMemo(() => {
        const totalLiquid = pockets.reduce((s, p) => s + p.balance, 0)
        let totalDebt = 0
        let monthlyObligations = 0
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endOfMonth.setHours(23, 59, 59, 999)

        obligations.forEach(o => {
            if (o.end_date || o.payments_left) {
                // Use explicitly stored payments_left if set; otherwise derive from dates
                const paymentsLeft = countRemainingPayments(o.next_due_date, o.end_date, o.frequency, now, o.payments_left)
                totalDebt += o.amount * paymentsLeft
            }

            // Exactly calculate how much is due in the remaining current calendar month
            let current = new Date(o.next_due_date)
            current.setHours(0, 0, 0, 0)

            const obsEnd = o.end_date ? new Date(o.end_date) : null
            if (obsEnd) obsEnd.setHours(23, 59, 59, 999)

            const hasLimit = o.payments_left != null && o.payments_left > 0
            let occurrences = 0

            while (current <= endOfMonth) {
                if (hasLimit && occurrences >= o.payments_left!) break
                if (obsEnd && current > obsEnd) break

                if (current >= now) {
                    monthlyObligations += o.amount
                    occurrences++
                }

                if (o.frequency === 'weekly') current.setDate(current.getDate() + 7)
                else if (o.frequency === 'bi-weekly') current.setDate(current.getDate() + 14)
                else if (o.frequency === 'monthly') current = addMonths(current, 1)
                else if (o.frequency === 'yearly') current = addMonths(current, 12)
                else break
            }
        })

        return { totalLiquid, totalDebt, monthlyObligations }
    }, [pockets, obligations])

    const loading = pLoading || oLoading || gLoading

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-white flex-shrink-0 shadow-sm z-10 gap-4 md:gap-0">
                <div>
                    <h1 className="text-[22px] font-bold text-black tracking-tight">Finance Dashboard</h1>
                    <p className="text-[12px] text-black/35 mt-0.5">Finance Module · {activeProfile === 'personal' ? 'Personal' : 'Studio Karrtesian'}</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-2 order-1 md:order-2">
                        {loading && (
                            <div className="flex items-center gap-1.5 text-black/30">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span className="text-[11px]">Syncing</span>
                            </div>
                        )}
                        <div className="text-[11px] text-black/25 uppercase tracking-wider font-medium">
                            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 order-2 md:order-3">
                        <button
                            onClick={togglePrivacy}
                            className={`p-2 rounded-xl border transition-all ${isPrivacyEnabled ? 'border-[#059669]/30 text-[#059669] bg-[#059669]/10 shadow-[0_2px_10px_rgba(5,150,105,0.1)]' : 'bg-white border-black/[0.06] text-black/40 hover:text-black/60 hover:border-black/[0.15] shadow-sm'}`}
                            title={isPrivacyEnabled ? "Disable Privacy Mode" : "Enable Privacy Mode"}
                        >
                            {isPrivacyEnabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="flex bg-black/[0.04] p-1 rounded-xl border border-black/[0.06] items-center order-3 md:order-1">
                        <button
                            onClick={() => setProfile('personal')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeProfile === 'personal' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black/60'}`}
                        >
                            <span className="hidden md:inline">Personal</span>
                            <span className="md:hidden">P</span>
                        </button>
                        <button
                            onClick={() => setProfile('business')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeProfile === 'business' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black/60'}`}
                        >
                            <span className="hidden md:inline">Business</span>
                            <span className="md:hidden">B</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#fafafa]">
                <div className="p-6 pb-2 select-none flex items-center gap-2 text-[13px] font-bold text-black/40 uppercase tracking-wider">
                    Overview
                </div>
                <div className="px-6 pb-6 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <SummaryCard
                            label="Total Liquid Cash"
                            value={`£${summary.totalLiquid.toFixed(2)}`}
                            icon={<Wallet className="w-5 h-5" />}
                            color="#059669"
                            sub={`${pockets.length} pockets`}
                            tooltip="The sum of current balances across all your active pockets. This is your immediately spendable money."
                        />
                        <SummaryCard
                            label="Total Debt Projection"
                            value={`£${summary.totalDebt.toFixed(2)}`}
                            icon={<TrendingDown className="w-5 h-5" />}
                            color="#dc2626"
                            sub="Estimated remaining on fixed terms"
                            tooltip={<span>For each obligation with an end date: <strong>payment amount × number of remaining payments</strong>. Monthly = months left. Weekly = months × 52÷12. Bi-weekly = months × 26÷12. Yearly = rounded years left (min 1). No end date = excluded.</span>}
                        />
                        <SummaryCard
                            label="Monthly Obligations"
                            value={`£${summary.monthlyObligations.toFixed(2)}`}
                            icon={<DollarSign className="w-5 h-5" />}
                            color="#d97706"
                            sub="Fixed debt payments"
                            tooltip="All recurring obligations normalised to a monthly equivalent. Monthly = as-is, weekly × 52 ÷ 12, bi-weekly × 26 ÷ 12, yearly ÷ 12."
                        />
                    </div>

                    {/* Main Layout Stack */}
                    <div className="flex flex-col gap-6 pb-12">
                        {/* Unified Responsive Grid (Mobile -> Tablet -> Desktop) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">

                            {/* Cashflow Analytics */}
                            <div className="order-3 lg:order-1 xl:order-1 col-span-1 lg:col-span-1 xl:col-span-2">
                                <CashflowAnalytics monthlyObligations={summary.monthlyObligations} />
                            </div>

                            {/* Savings Goals */}
                            <div className="order-1 lg:order-2 xl:order-2 col-span-1 h-full">
                                <SectionBlock title="Savings Goals" desc="Long-term targets">
                                    <GoalsList goals={goals} onRefresh={refetchGoals} />
                                </SectionBlock>
                            </div>

                            {/* Pockets */}
                            <div className="order-2 lg:order-4 xl:order-4 col-span-1 lg:col-span-2 xl:col-span-3">
                                <SectionBlock title="Pockets" desc="Your current allocations">
                                    <PocketsGrid pockets={pockets} />
                                </SectionBlock>
                            </div>

                            {/* Liabilities */}
                            <div className="order-5 lg:order-5 xl:order-5 col-span-1 lg:col-span-2 xl:col-span-3">
                                <SectionBlock title="Liabilities" desc="30-Day projections for subs & debt">
                                    <CalendarVisualizer obligations={obligations} />
                                </SectionBlock>
                            </div>
                        </div>

                        {/* Bottom Row: Recent Ledger & AI Chat */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                            <div className="col-span-1 h-full min-h-[500px]">
                                <SectionBlock title="Recent Ledger" desc="Latest transactions">
                                    <TransactionLedger />
                                </SectionBlock>
                            </div>
                            <div className="col-span-1 h-full min-h-[500px]">
                                <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm h-full flex flex-col">
                                    <h2 className="text-[17px] font-bold text-black mb-1">Financial Co-pilot</h2>
                                    <p className="text-[12px] text-black/40 mb-4">Ask Gemini about patterns, advice, or status</p>
                                    <div className="flex-1 overflow-hidden min-h-[400px]">
                                        <KarrAIChat
                                            context={{
                                                pockets: pockets.map(p => ({ n: p.name, b: p.balance, t: p.target_budget })),
                                                goals: goals.map(g => ({ n: g.name, c: g.current_amount, t: g.target_amount })),
                                                obligations: obligations.map(o => ({ n: o.name, a: o.amount, f: o.frequency, d: o.next_due_date }))
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Action Button */}
                        <QuickActionFAB
                            pockets={pockets}
                            obligations={obligations}
                            goals={goals}
                            onSuccess={() => { refetchPockets(); refetchGoals(); refetchTransactions(); }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function SummaryCard({ label, value, icon, color, sub, tooltip }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string; tooltip?: string | React.ReactNode }) {
    return (
        <div className="rounded-xl border border-black/[0.07] bg-white p-4 hover:bg-black/[0.01] transition-colors shadow-sm flex flex-col h-full">
            <div className="flex flex-col gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <p className="text-[11px] uppercase tracking-wider text-black/40 font-semibold">{label}</p>
                    {tooltip && <InfoTooltip content={tooltip} side="bottom" />}
                </div>
            </div>
            <div className="mt-auto pt-2">
                <p className="text-2xl font-bold text-black tracking-tight privacy-blur">{value}</p>
                {sub && <p className="text-[11px] text-black/35 mt-1">{sub}</p>}
            </div>
        </div>
    )
}

function SectionBlock({ title, desc, children }: { title?: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            {(title || desc) && (
                <div className="flex items-baseline gap-2 mb-4">
                    {title && <h2 className="text-[14px] font-bold text-black">{title}</h2>}
                    {desc && <span className="text-[11px] text-black/35">{desc}</span>}
                </div>
            )}
            {children}
        </div>
    )
}
