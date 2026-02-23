'use client'

import { LayoutDashboard, Activity, TrendingUp, Heart, Terminal, Lock, Target, AlertCircle, RefreshCw, BarChart3, Brain, Shield, SlidersHorizontal, Sparkles } from 'lucide-react'
import { KarrFooter } from '@/components/KarrFooter'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useTransactions } from '@/features/finance/hooks/useTransactions'
import { ScheduleWidget } from '@/features/dashboard/components/ScheduleWidget'
import { cn } from '@/lib/utils'
import { isShiftDay } from '@/features/finance/utils/rotaUtils'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { useRota } from '@/features/finance/hooks/useRota'

const MOTIVATION_QUOTES = [
    { text: "The mind is the battlefield. Control what you can, let the rest burn.", tag: "Stoic" },
    { text: "Adapt like water to the 9-to-5 work, but carry the boats when you return to the Studio.", tag: "Taoist/Goggins" },
    { text: "You have to build calluses on your brain. Suffer through the friction of the process to unlock the Exceptional Promise.", tag: "Goggins" },
    { text: "Do not outsource your discipline to your feelings. The obstacle is the way. Act.", tag: "Stoic" },
    { text: "Nature does not hurry, yet everything is accomplished. Stay relentless, but stay fluid.", tag: "Taoist" }
]

export default function ControlCentrePage() {
    const { tasks, loading: tasksLoading } = useTasks('todo')
    const { transactions, loading: financeLoading } = useTransactions()
    const { overrides, loading: rotaLoading } = useRota() // Added useRota hook
    const { settings } = useSystemSettings() // Added useSystemSettings hook
    const [quoteIndex, setQuoteIndex] = useState(0)

    // Motivation Rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length)
        }, 10000)
        return () => clearInterval(interval)
    }, [])

    // Data Aggregation
    const stats = useMemo(() => {
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const weeklyTasks = tasks.filter(t => new Date(t.created_at) >= oneWeekAgo)
        const taskCompletion = weeklyTasks.length > 0
            ? (weeklyTasks.filter(t => t.is_completed).length / weeklyTasks.length) * 100
            : 0

        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const monthlyInflow = transactions
            .filter(t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo)
            .reduce((s, t) => s + t.amount, 0)
        const monthlyOutflow = transactions
            .filter(t => t.type === 'spend' && new Date(t.date) >= thirtyDaysAgo)
            .reduce((s, t) => s + t.amount, 0)

        const budgetScore = monthlyInflow > 0
            ? Math.max(0, 100 - (monthlyOutflow / monthlyInflow) * 100)
            : 0

        const score = Math.round((taskCompletion * 0.5) + (budgetScore * 0.5))

        let nextAction = "System optimal. No high-priority items."
        const highPriorityTask = tasks.find(t => !t.is_completed && (t.priority === 'super' || t.priority === 'high'))

        if (highPriorityTask) {
            nextAction = `High Priority: ${highPriorityTask.title}`
        } else if (monthlyOutflow > monthlyInflow && monthlyInflow > 0) {
            nextAction = "Spending exceeds income — Review budget."
        } else {
            const nextPending = tasks.find(t => !t.is_completed)
            if (nextPending) nextAction = `Next Up: ${nextPending.title}`
        }

        return { score, nextAction, taskCompletion, budgetScore }
    }, [tasks, transactions])

    const loading = tasksLoading || financeLoading || rotaLoading // Added rotaLoading to overall loading state

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Page Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-white flex-shrink-0 shadow-sm z-10">
                <div>
                    <h1 className="text-[22px] font-bold text-black tracking-tight">Control Centre</h1>
                    <p className="text-[12px] text-black/35 mt-0.5">System Hub</p>
                </div>
                <div className="flex items-center gap-3">
                    {loading && (
                        <div className="flex items-center gap-1.5 text-black/30">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-[11px]">Scanning</span>
                        </div>
                    )}
                    <div className="text-[11px] text-black/25 uppercase tracking-wider font-medium">
                        {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#fafafa] flex flex-col p-6">
                <div className="max-w-5xl mx-auto w-full space-y-8 pb-12">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Link
                            href="/finances"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-black/[0.06] rounded-xl hover:border-black/20 hover:bg-black/[0.02] transition-all group"
                        >
                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[12px] font-bold text-black/70 group-hover:text-black">Finances</span>
                        </Link>
                        <Link
                            href="/tasks"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-black/[0.06] rounded-xl hover:border-black/20 hover:bg-black/[0.02] transition-all group"
                        >
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <Activity className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[12px] font-bold text-black/70 group-hover:text-black">Operations</span>
                        </Link>
                        <Link
                            href="/vault"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-black/[0.06] rounded-xl hover:border-black/20 hover:bg-black/[0.02] transition-all group"
                        >
                            <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                <Shield className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[12px] font-bold text-black/70 group-hover:text-black">Vault</span>
                        </Link>
                        <Link
                            href="/intelligence"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-black/[0.06] rounded-xl hover:border-black/20 hover:bg-black/[0.02] transition-all group"
                        >
                            <div className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                                <Sparkles className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[12px] font-bold text-black/70 group-hover:text-black">Karr AI</span>
                        </Link>
                        <Link
                            href="/system/settings"
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-black/[0.06] rounded-xl hover:border-black/20 hover:bg-black/[0.02] transition-all group"
                        >
                            <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[12px] font-bold text-black/70 group-hover:text-black">Settings</span>
                        </Link>
                    </div>

                    {/* Summary Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SummaryCard
                            label="Next Objective"
                            value={loading ? "INDEXING..." : stats.nextAction}
                            icon={<Target className="w-5 h-5" />}
                            color="#3b82f6"
                            sub="Action Engine Recommendation"
                        />
                        <SummaryCard
                            label="Karrtesian Score"
                            value={`${stats.score}/100`}
                            icon={<TrendingUp className="w-5 h-5" />}
                            color="#059669"
                            sub="Discipline & Budget Index"
                        />
                        <SummaryCard
                            label="Pending Items"
                            value={tasks.filter(t => !t.is_completed).length.toString()}
                            icon={<Activity className="w-5 h-5" />}
                            color="#f59e0b"
                            sub="Ops requiring attention"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Efficiency Matrix */}
                        <div className="lg:col-span-2 space-y-6">
                            <SectionBlock title="Efficiency Analysis" desc="Performance metrics">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <div className="relative w-32 h-32">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-black/[0.05]" />
                                                <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="10" strokeDasharray={352} strokeDashoffset={352 - (352 * stats.score) / 100} strokeLinecap="round" className="text-black transition-all duration-1000 ease-in-out" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl font-black">{stats.score}</span>
                                            </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-black/40 uppercase tracking-widest mt-4">Karrtesian Index</p>
                                    </div>

                                    <div className="space-y-6 flex flex-col justify-center">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[12px] font-bold text-black/60">Task Completion</span>
                                                <span className="text-[12px] font-mono">{Math.round(stats.taskCompletion)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-black/[0.04] rounded-full overflow-hidden">
                                                <div className="h-full bg-black transition-all duration-700" style={{ width: `${stats.taskCompletion}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[12px] font-bold text-black/60">Budget Adherence</span>
                                                <span className="text-[12px] font-mono">{Math.round(stats.budgetScore)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-black/[0.04] rounded-full overflow-hidden">
                                                <div className="h-full bg-black transition-all duration-700" style={{ width: `${stats.budgetScore}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SectionBlock>

                            {/* Philosophy Engine */}
                            <div className="bg-black text-white rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col justify-center">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                                    <Terminal className="w-32 h-32" />
                                </div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[9px] font-mono tracking-widest uppercase text-white/40">Philosophy Engine // Synchronised</p>
                                </div>
                                <div className="min-h-[80px] flex flex-col justify-center">
                                    <p className="text-[17px] font-medium leading-relaxed font-mono" key={quoteIndex}>
                                        "{MOTIVATION_QUOTES[quoteIndex].text}"
                                    </p>
                                    <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mt-4">— {MOTIVATION_QUOTES[quoteIndex].tag}</p>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Widget */}
                        <div className="lg:col-span-1">
                            <ScheduleWidget />
                        </div>
                    </div>
                </div>
                <KarrFooter />
            </div>
        </div>
    )
}

function SummaryCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string }) {
    return (
        <div className="rounded-xl border border-black/[0.07] bg-white p-4 hover:bg-black/[0.01] transition-colors shadow-sm flex flex-col h-full">
            <div className="flex flex-col gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
                    {icon}
                </div>
                <p className="text-[11px] uppercase tracking-wider text-black/40 font-semibold">{label}</p>
            </div>
            <div className="mt-auto">
                <p className="text-lg font-bold text-black tracking-tight line-clamp-2">{value}</p>
                {sub && <p className="text-[11px] text-black/35 mt-1">{sub}</p>}
            </div>
        </div>
    )
}

function SectionBlock({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm">
            <div className="flex items-baseline gap-2 mb-6">
                <h2 className="text-[15px] font-bold text-black">{title}</h2>
                <span className="text-[11px] text-black/35 font-medium">{desc}</span>
            </div>
            {children}
        </div>
    )
}
