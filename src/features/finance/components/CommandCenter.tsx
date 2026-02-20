'use client'

import { useMemo } from 'react'
import { DollarSign, TrendingDown, Wallet, RefreshCw } from 'lucide-react'
import { usePockets } from '../hooks/usePockets'
import { useDebts } from '../hooks/useDebts'
import { useGoals } from '../hooks/useGoals'
import { PocketsGrid } from './PocketsGrid'
import { DebtVisualizer } from './DebtVisualizer'
import { GoalsList } from './GoalsList'
import { KarrAIChat } from './KarrAIChat'
import { QuickActionFAB } from './QuickActionFAB'

export function CommandCenter() {
    const { pockets, loading: pLoading, refetch: refetchPockets } = usePockets()
    const { debts, loading: dLoading } = useDebts()
    const { goals, loading: gLoading } = useGoals()

    const summary = useMemo(() => {
        const totalLiquid = pockets.reduce((s, p) => s + p.current_balance, 0)
        const totalDebt = debts.reduce((s, d) => s + d.remaining_balance, 0)
        const monthlyObligations = debts.reduce((s, d) => s + d.monthly_payment, 0)
        return { totalLiquid, totalDebt, monthlyObligations }
    }, [pockets, debts])

    const loading = pLoading || dLoading || gLoading

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Page Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-white">
                <div>
                    <h1 className="text-[22px] font-bold text-black tracking-tight">Command Center</h1>
                    <p className="text-[12px] text-black/35 mt-0.5">Finance Module · Studio Karrtesian</p>
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

            <div className="flex-1 overflow-y-auto bg-[#fafafa]">
                <div className="p-6 space-y-8">
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
                            label="Total Debt"
                            value={`£${summary.totalDebt.toFixed(2)}`}
                            icon={<TrendingDown className="w-5 h-5" />}
                            color="#dc2626"
                            sub={`${debts.length} active agreements`}
                        />
                        <SummaryCard
                            label="Monthly Obligations"
                            value={`£${summary.monthlyObligations.toFixed(2)}`}
                            icon={<DollarSign className="w-5 h-5" />}
                            color="#d97706"
                            sub="Fixed debt payments"
                        />
                    </div>

                    {/* Main grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <Section label="Pockets" desc="Your current allocations">
                                <PocketsGrid pockets={pockets} />
                            </Section>
                            <Section label="Savings Goals" desc="Long-term targets">
                                <GoalsList goals={goals} />
                            </Section>
                            <Section label="Debt Tracker" desc="Active credit agreements">
                                <DebtVisualizer debts={debts} />
                            </Section>
                        </div>
                        <div className="xl:col-span-1">
                            <div className="sticky top-6 rounded-xl border border-black/[0.07] bg-white p-4 shadow-sm">
                                <KarrAIChat />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <QuickActionFAB pockets={pockets} onSuccess={refetchPockets} />
        </div>
    )
}

function SummaryCard({ label, value, icon, color, sub }: {
    label: string; value: string; icon: React.ReactNode; color: string; sub?: string
}) {
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

function Section({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-[14px] font-bold text-black">{label}</h2>
                <span className="text-[11px] text-black/35">{desc}</span>
            </div>
            {children}
        </div>
    )
}
