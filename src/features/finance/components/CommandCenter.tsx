'use client'

import { useMemo, useState, useEffect } from 'react'
import { DollarSign, TrendingDown, Wallet, RefreshCw } from 'lucide-react'
import { usePockets } from '../hooks/usePockets'
import { useRecurring } from '../hooks/useRecurring'
import { useGoals } from '../hooks/useGoals'
import { PocketsGrid } from './PocketsGrid'
import { CalendarVisualizer } from './CalendarVisualizer'
import { GoalsList } from './GoalsList'
import { KarrAIChat } from './KarrAIChat'
import { QuickActionFAB } from './QuickActionFAB'
import { PaydayAllocation } from './PaydayAllocation'
import { CashflowAnalytics } from './CashflowAnalytics'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function CommandCenter() {
    const { pockets, loading: pLoading, refetch: refetchPockets } = usePockets()
    const { obligations, loading: oLoading } = useRecurring()
    const { goals, loading: gLoading, refetch: refetchGoals } = useGoals()
    const { activeProfile, setProfile } = useFinanceProfile()

    const summary = useMemo(() => {
        const totalLiquid = pockets.reduce((s, p) => s + p.balance, 0)
        let totalDebt = 0
        let monthlyObligations = 0

        obligations.forEach(o => {
            if (o.end_date) {
                const end = new Date(o.end_date)
                const now = new Date()
                if (end > now) {
                    const monthsLeft = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
                    if (monthsLeft > 0) totalDebt += (o.amount * (o.frequency === 'monthly' ? monthsLeft : o.frequency === 'weekly' ? monthsLeft * 4 : o.frequency === 'bi-weekly' ? monthsLeft * 2 : monthsLeft / 12))
                }
            }

            if (o.frequency === 'monthly') monthlyObligations += o.amount
            if (o.frequency === 'weekly') monthlyObligations += (o.amount * 52) / 12
            if (o.frequency === 'bi-weekly') monthlyObligations += (o.amount * 26) / 12
            if (o.frequency === 'yearly') monthlyObligations += o.amount / 12
        })

        return { totalLiquid, totalDebt, monthlyObligations }
    }, [pockets, obligations])

    const loading = pLoading || oLoading || gLoading

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Page Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-white">
                <div>
                    <h1 className="text-[22px] font-bold text-black tracking-tight">Command Center</h1>
                    <p className="text-[12px] text-black/35 mt-0.5">Finance Module · {activeProfile === 'personal' ? 'Personal' : 'Studio Karrtesian'}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-black/[0.04] p-1 rounded-xl border border-black/[0.06]">
                        <button
                            onClick={() => setProfile('personal')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeProfile === 'personal' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black/60'}`}
                        >
                            Personal
                        </button>
                        <button
                            onClick={() => setProfile('business')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeProfile === 'business' ? 'bg-white text-black shadow-sm' : 'text-black/40 hover:text-black/60'}`}
                        >
                            Business
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
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
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#fafafa]">
                <div className="p-6 pb-2 select-none flex items-center gap-2 text-[13px] font-bold text-black/40 uppercase tracking-wider">
                    Finance Dashboard
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
                        />
                        <SummaryCard
                            label="Total Debt Projection"
                            value={`£${summary.totalDebt.toFixed(2)}`}
                            icon={<TrendingDown className="w-5 h-5" />}
                            color="#dc2626"
                            sub="Estimated remaining on fixed terms"
                        />
                        <SummaryCard
                            label="Monthly Obligations"
                            value={`£${summary.monthlyObligations.toFixed(2)}`}
                            icon={<DollarSign className="w-5 h-5" />}
                            color="#d97706"
                            sub="Fixed debt payments"
                        />
                    </div>

                    {/* Main Layout Stack */}
                    <div className="space-y-6 pb-12">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                            <div className="xl:col-span-1">
                                <CashflowAnalytics />
                            </div>
                            <div className="xl:col-span-2">
                                <PaydayAllocation pockets={pockets} goals={goals} onSuccess={() => { refetchPockets(); refetchGoals(); }} />
                            </div>
                        </div>

                        <SectionBlock title="Savings Goals" desc="Long-term targets">
                            <GoalsList goals={goals} />
                        </SectionBlock>

                        <SectionBlock title="Pockets" desc="Your current allocations">
                            <PocketsGrid pockets={pockets} />
                        </SectionBlock>

                        <SectionBlock title="Recurring Obligations" desc="30-Day projections for subs, rent, & debt">
                            <CalendarVisualizer obligations={obligations} />
                        </SectionBlock>

                        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
                            <KarrAIChat
                                context={`Live Balances:\n${pockets.map(p => `- ${p.name}: £${p.balance.toFixed(2)}`).join('\n')}`}
                                onAction={() => { refetchPockets(); refetchGoals(); }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <QuickActionFAB pockets={pockets} onSuccess={refetchPockets} />
        </div>
    )
}

function SummaryCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string }) {
    return (
        <div className="rounded-xl border border-black/[0.07] bg-white p-4 hover:bg-black/[0.01] transition-colors shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-wider text-black/40 font-semibold">{label}</p>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
                    <span style={{ color }}>{icon}</span>
                </div>
            </div>
            <p className="text-2xl font-bold text-black tracking-tight">{value}</p>
            {sub && <p className="text-[11px] text-black/35 mt-1">{sub}</p>}
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
