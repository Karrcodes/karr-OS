'use client'

import { LayoutDashboard, CheckSquare, TrendingUp, Heart, Terminal, Lock, Target, AlertCircle, RefreshCw } from 'lucide-react'
import { KarrFooter } from '@/components/KarrFooter'
import { useState, useEffect, useMemo } from 'react'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useTransactions } from '@/features/finance/hooks/useTransactions'
import { cn } from '@/lib/utils'

const MOTIVATION_QUOTES = [
    { text: "The mind is the battlefield. Control what you can, let the rest burn.", tag: "Stoic" },
    { text: "Adapt like water to the 12-hour shift, but carry the boats when you return to the Studio.", tag: "Taoist/Goggins" },
    { text: "You have to build calluses on your brain. Suffer through the friction of the process to unlock the Exceptional Promise.", tag: "Goggins" },
    { text: "Do not outsource your discipline to your feelings. The obstacle is the way. Act.", tag: "Stoic" },
    { text: "Nature does not hurry, yet everything is accomplished. Stay relentless, but stay fluid.", tag: "Taoist" }
]

export default function ControlCentrePage() {
    const { tasks, loading: tasksLoading } = useTasks('todo')
    const { transactions, loading: financeLoading } = useTransactions()
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
        // 1. Task Completion (This week)
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const weeklyTasks = tasks.filter(t => new Date(t.created_at) >= oneWeekAgo)
        const taskCompletion = weeklyTasks.length > 0
            ? (weeklyTasks.filter(t => t.is_completed).length / weeklyTasks.length) * 100
            : 0

        // 2. Budget Adherence (Simplified 30d inflow vs outflow)
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

        // 3. Overall Productivity Score
        const score = Math.round((taskCompletion * 0.5) + (budgetScore * 0.5))

        // 4. Next Action Logic
        let nextAction = "No urgent items detected. Review roadmap."
        const highPriorityTask = tasks.find(t => !t.is_completed && (t.priority === 'super' || t.priority === 'high'))

        if (highPriorityTask) {
            nextAction = `Execute: ${highPriorityTask.title}`
        } else if (monthlyOutflow > monthlyInflow && monthlyInflow > 0) {
            nextAction = "Optimize: Outflow exceeding inflow. Review transactions."
        } else {
            const nextPending = tasks.find(t => !t.is_completed)
            if (nextPending) nextAction = `Next task: ${nextPending.title}`
        }

        return { score, nextAction, taskCompletion, budgetScore }
    }, [tasks, transactions])

    const loading = tasksLoading || financeLoading

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col">
            <div className="bg-white border-b border-black/[0.06] px-6 py-5 z-20 shadow-sm shrink-0">
                <div className="max-w-5xl mx-auto flex items-center gap-4">
                    <div>
                        <h1 className="text-[20px] font-bold text-black tracking-tight flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-black" />
                            Command Centre
                        </h1>
                        <p className="text-[12px] text-black/35 mt-0.5">Efficiency & Discipline Engine</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                <div className="max-w-5xl mx-auto w-full flex-1 mb-12 space-y-6">

                    {/* A. Next Action Engine */}
                    <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Target className="w-24 h-24 text-black" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40 mb-2">Efficiency HUD</p>
                            <h2 className="text-[24px] font-black text-black leading-tight tracking-tight">
                                {loading ? (
                                    <span className="flex items-center gap-2">Scanning Engine <RefreshCw className="w-5 h-5 animate-spin" /></span>
                                ) : stats.nextAction}
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* B. Karrtesian Productivity Score */}
                        <div className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40 mb-6">Productivity Score</p>
                            <div className="relative w-40 h-40">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        className="text-black/[0.05]"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="transparent"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * stats.score) / 100}
                                        strokeLinecap="round"
                                        className="text-black transition-all duration-1000 ease-in-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[32px] font-black text-black leading-none">{stats.score}</span>
                                    <span className="text-[10px] font-bold text-black/30 tracking-widest mt-1 uppercase text-center px-4">Karrtesian Index</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 w-full mt-6 pt-6 border-t border-black/[0.04]">
                                <div className="text-center">
                                    <p className="text-[18px] font-bold text-black">{Math.round(stats.taskCompletion)}%</p>
                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">Tasks</p>
                                </div>
                                <div className="text-center border-l border-black/[0.04]">
                                    <p className="text-[18px] font-bold text-black">{Math.round(stats.budgetScore)}%</p>
                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-widest">Budget</p>
                                </div>
                            </div>
                        </div>

                        {/* C. Fitness & Consistency Tracker (Placeholder) */}
                        <div className="bg-white border border-black/[0.08] rounded-2xl p-6 shadow-sm flex flex-col relative group overflow-hidden">
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/40 mb-4">Fitness & Consistency</p>

                            <div className="space-y-4 filter blur-[2px] opacity-20 pointer-events-none select-none">
                                <div className="flex gap-2">
                                    {[...Array(7)].map((_, i) => (
                                        <div key={i} className="flex-1 h-12 rounded-lg bg-black/10 border border-black/5" />
                                    ))}
                                </div>
                                <div className="h-24 w-full rounded-xl bg-black/10 border border-black/5" />
                            </div>

                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                                <div className="bg-black text-white px-4 py-2 rotate-[-2deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                                    <p className="text-[14px] font-black tracking-tighter uppercase">System Offline</p>
                                </div>
                                <p className="text-[10px] font-bold text-black/40 mt-4 max-w-[200px] leading-relaxed uppercase tracking-widest">
                                    Awaiting Health & Well-being Module Integration
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* D. The "Callused Mind" Motivation Matrix */}
                    <div className="bg-black text-white rounded-2xl p-8 shadow-xl relative overflow-hidden min-h-[220px] flex flex-col justify-center border-4 border-black group">
                        <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                            <Terminal className="w-64 h-64" />
                        </div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/40">Philosophy Engine 2.0 // Node Active</p>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[18px] md:text-[22px] font-medium leading-relaxed font-mono animate-in fade-in slide-in-from-left-2 duration-700" key={quoteIndex}>
                                <span className="text-emerald-500 mr-2">$</span>
                                {MOTIVATION_QUOTES[quoteIndex].text}
                            </p>
                            <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.2em]">Source: [{MOTIVATION_QUOTES[quoteIndex].tag}]</p>
                        </div>
                    </div>

                </div>
                <KarrFooter />
            </div>
        </div>
    )
}
