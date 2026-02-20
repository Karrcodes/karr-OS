'use client'

import { useMemo, useState, useEffect } from 'react'
import { DollarSign, TrendingDown, Wallet, RefreshCw } from 'lucide-react'
import { usePockets } from '../hooks/usePockets'
import { useRecurring } from '../hooks/useRecurring'
import { useGoals } from '../hooks/useGoals'
import { useSettings } from '../hooks/useSettings'
import { PocketsGrid } from './PocketsGrid'
import { CalendarVisualizer } from './CalendarVisualizer'
import { GoalsList } from './GoalsList'
import { KarrAIChat } from './KarrAIChat'
import { QuickActionFAB } from './QuickActionFAB'
import { PaydayAllocation } from './PaydayAllocation'
import { CashflowAnalytics } from './CashflowAnalytics'
import { DraggableSection } from './DraggableSection'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable'

export function CommandCenter() {
    const { pockets, loading: pLoading, refetch: refetchPockets } = usePockets()
    const { obligations, loading: oLoading } = useRecurring()
    const { goals, loading: gLoading, refetch: refetchGoals } = useGoals()

    const summary = useMemo(() => {
        const totalLiquid = pockets.reduce((s, p) => s + p.balance, 0)

        let totalDebt = 0
        let monthlyObligations = 0

        obligations.forEach(o => {
            // Very rough approximation for fixed debts (has end_date)
            if (o.end_date) {
                const end = new Date(o.end_date)
                const now = new Date()
                if (end > now) {
                    const monthsLeft = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
                    if (monthsLeft > 0) totalDebt += (o.amount * (o.frequency === 'monthly' ? monthsLeft : o.frequency === 'weekly' ? monthsLeft * 4 : o.frequency === 'bi-weekly' ? monthsLeft * 2 : monthsLeft / 12))
                }
            }

            // Normalize everything to a rough monthly amount for the summary card
            if (o.frequency === 'monthly') monthlyObligations += o.amount
            if (o.frequency === 'weekly') monthlyObligations += (o.amount * 52) / 12
            if (o.frequency === 'bi-weekly') monthlyObligations += (o.amount * 26) / 12
            if (o.frequency === 'yearly') monthlyObligations += o.amount / 12
        })

        return { totalLiquid, totalDebt, monthlyObligations }
    }, [pockets, obligations])

    const { settings, loading: sLoading, setSetting } = useSettings()
    const loading = pLoading || oLoading || gLoading || sLoading

    // --- Drag and Drop State ---
    const defaultOrder = [
        'payday',
        'pockets',
        'goals',
        'obligations',
        'analytics',
        'ai'
    ]

    const [sectionOrder, setSectionOrder] = useState<string[]>(defaultOrder)

    // Load saved order from Supabase settings on mount
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        if (!sLoading) {
            const saved = settings['dashboard_layout_order']
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed) && parsed.length === defaultOrder.length) {
                        setSectionOrder(parsed)
                    }
                } catch (e) { }
            }
            setMounted(true)
        }
    }, [sLoading, settings, defaultOrder.length])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setSectionOrder((items: string[]) => {
                const oldIndex = items.indexOf(active.id as string)
                const newIndex = items.indexOf(over.id as string)
                const newOrder = arrayMove(items, oldIndex, newIndex)

                // Save globally to database instead of localStorage
                setSetting('dashboard_layout_order', JSON.stringify(newOrder))

                return newOrder
            })
        }
    }

    if (!mounted) return null // Prevent hydration mismatch on initial render

    // Component Maps for rendering based on sort order
    const sectionComponents: Record<string, React.ReactNode> = {
        'payday': (
            <DraggableSection key="payday" id="payday" className="xl:col-span-2 h-full">
                <PaydayAllocation pockets={pockets} goals={goals} onSuccess={() => { refetchPockets(); refetchGoals(); }} />
            </DraggableSection>
        ),
        'pockets': (
            <DraggableSection key="pockets" id="pockets" title="Pockets" desc="Your current allocations" className="xl:col-span-2 h-full">
                <PocketsGrid pockets={pockets} />
            </DraggableSection>
        ),
        'goals': (
            <DraggableSection key="goals" id="goals" title="Savings Goals" desc="Long-term targets" className="xl:col-span-2 h-full">
                <GoalsList goals={goals} />
            </DraggableSection>
        ),
        'obligations': (
            <DraggableSection key="obligations" id="obligations" title="Recurring Obligations" desc="30-Day projections for subs, rent, & debt" className="xl:col-span-2 h-full">
                <CalendarVisualizer obligations={obligations} />
            </DraggableSection>
        ),
        'analytics': (
            <DraggableSection key="analytics" id="analytics" className="xl:col-span-1 h-full h-min">
                <CashflowAnalytics />
            </DraggableSection>
        ),
        'ai': (
            <DraggableSection key="ai" id="ai" className="xl:col-span-1 bg-transparent border-none shadow-none !p-0 h-full h-min drop-shadow-sm">
                <div className="rounded-2xl border border-black/[0.08] bg-white p-5 h-full">
                    <KarrAIChat context={`Live Balances:\n${pockets.map(p => `- ${p.name}: £${p.balance.toFixed(2)}`).join('\n')}`} />
                </div>
            </DraggableSection>
        )
    }

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

            <details className="flex-1 overflow-y-auto bg-[#fafafa] group" open>
                <summary className="p-6 pb-2 cursor-pointer list-none select-none flex items-center gap-2 text-[13px] font-bold text-black/40 hover:text-black/60 transition-colors uppercase tracking-wider">
                    <span className="group-open:-rotate-90 transition-transform duration-200">▼</span> Finance Dashboard
                </summary>
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

                    {/* Main grid */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={sectionOrder} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start grid-flow-dense pb-12">
                                {sectionOrder.map((id: string) => sectionComponents[id])}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </details>

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
