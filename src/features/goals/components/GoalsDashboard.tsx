'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Target,
    Plus,
    ChevronRight,
    ChevronDown,
    CheckCircle2,
    Circle,
    TrendingUp,
    Calendar,
    Briefcase,
    Heart,
    User,
    Wallet,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGoals } from '../hooks/useGoals'
import GoalCreationModal from './GoalCreationModal'
import type { Goal, GoalCategory } from '../types/goals.types'

const CATEGORY_CONFIG: Record<GoalCategory, { label: string, icon: any, color: string }> = {
    finance: { label: 'Finance', icon: Wallet, color: 'text-emerald-500 bg-emerald-50' },
    career: { label: 'Career', icon: Briefcase, color: 'text-blue-500 bg-blue-50' },
    health: { label: 'Health', icon: Heart, color: 'text-rose-500 bg-rose-50' },
    personal: { label: 'Personal', icon: User, color: 'text-purple-500 bg-purple-50' }
}

export default function GoalsDashboard() {
    const { goals, loading, createGoal, toggleMilestone } = useGoals()
    const [filter, setFilter] = useState<GoalCategory | 'all'>('all')
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const filteredGoals = useMemo(() => {
        if (filter === 'all') return goals
        return goals.filter(g => g.category === filter)
    }, [goals, filter])

    const stats = useMemo(() => {
        const completed = goals.filter(g => g.status === 'completed').length
        const total = goals.length
        const progress = total > 0 ? (completed / total) * 100 : 0
        return { completed, total, progress }
    }, [goals])

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-black/5 border-t-black rounded-full animate-spin" />
                    <span className="text-sm font-bold text-black/40 uppercase tracking-widest">Loading Aspirations...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 p-4 sm:p-8 max-w-7xl mx-auto">
            {/* Header with Stats */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black italic tracking-tighter text-black">STRATEGIC GOALS</h1>
                    <p className="text-black/40 font-bold uppercase tracking-widest text-xs">High-level targets and tactical milestones</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-6 py-4 bg-white border border-black/5 rounded-2xl shadow-sm flex items-center gap-6">
                        <div className="space-y-0.5">
                            <span className="block text-[10px] font-black text-black/20 uppercase tracking-widest">Completed</span>
                            <span className="text-2xl font-black tracking-tighter text-emerald-500">{stats.completed}/{stats.total}</span>
                        </div>
                        <div className="w-px h-10 bg-black/5" />
                        <div className="space-y-0.5">
                            <span className="block text-[10px] font-black text-black/20 uppercase tracking-widest">Success Rate</span>
                            <span className="text-2xl font-black tracking-tighter text-black">{Math.round(stats.progress)}%</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                    <FilterPill active={filter === 'all'} onClick={() => setFilter('all')} label="All Modules" />
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <FilterPill
                            key={key}
                            active={filter === key}
                            onClick={() => setFilter(key as any)}
                            label={config.label}
                        />
                    ))}
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 group"
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    Set New Goal
                </button>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredGoals.map((goal, idx) => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            index={idx}
                            isExpanded={expandedGoalId === goal.id}
                            onToggle={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                            onToggleMilestone={toggleMilestone}
                        />
                    ))}
                </AnimatePresence>
            </div>

            <GoalCreationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={createGoal}
            />
        </div>
    )
}

function FilterPill({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                active
                    ? "bg-black text-white shadow-lg"
                    : "bg-black/[0.03] text-black/40 hover:bg-black/[0.06]"
            )}
        >
            {label}
        </button>
    )
}

function GoalCard({ goal, index, isExpanded, onToggle, onToggleMilestone }: {
    goal: Goal,
    index: number,
    isExpanded: boolean,
    onToggle: () => void,
    onToggleMilestone: (id: string, completed: boolean) => void
}) {
    const config = CATEGORY_CONFIG[goal.category]
    const Icon = config.icon

    const completedMilestones = goal.milestones?.filter(m => m.is_completed).length || 0
    const totalMilestones = goal.milestones?.length || 0
    const progressPerc = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "group bg-white border border-black/[0.06] rounded-[32px] overflow-hidden transition-all",
                isExpanded ? "ring-2 ring-black" : "hover:border-black/20 hover:shadow-xl hover:shadow-black/5"
            )}
        >
            <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", config.color)}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black tracking-tight group-hover:text-black transition-colors">{goal.title}</h3>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", config.color)}>
                                    {config.label}
                                </span>
                                {goal.target_date && (
                                    <span className="text-[10px] font-bold text-black/20 flex items-center gap-1 uppercase tracking-widest">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(goal.target_date).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {goal.priority === 'super' && (
                        <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 animate-pulse">
                            <TrendingUp className="w-3 h-3" />
                            Tier 1 Priority
                        </div>
                    )}
                </div>

                {/* Description */}
                <p className="text-sm font-medium text-black/50 leading-relaxed">
                    {goal.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-black/40">Tactical Progress</span>
                        <span className="text-black">{Math.round(progressPerc)}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPerc}%` }}
                            className={cn(
                                "h-full transition-all duration-1000",
                                progressPerc === 100 ? "bg-emerald-500" : "bg-black"
                            )}
                        />
                    </div>
                </div>

                {/* Footer / Expand Toggle */}
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-between py-4 border-t border-black/5 group/btn"
                >
                    <span className="text-xs font-black uppercase tracking-widest text-black/40 group-hover/btn:text-black transition-colors">
                        {totalMilestones} Milestones {isExpanded ? 'active' : 'available'}
                    </span>
                    <div className={cn(
                        "w-8 h-8 rounded-full bg-black/5 flex items-center justify-center transition-all group-hover/btn:bg-black group-hover/btn:text-white",
                        isExpanded ? "rotate-180" : ""
                    )}>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </button>

                {/* Milestones List */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-3 pt-2 pb-4">
                                {goal.milestones?.map((m, idx) => (
                                    <div
                                        key={m.id}
                                        onClick={() => onToggleMilestone(m.id, !m.is_completed)}
                                        className={cn(
                                            "group/m flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer",
                                            m.is_completed
                                                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                                : "bg-black/[0.02] border-black/[0.04] text-black/60 hover:border-black/10 hover:bg-black/[0.04]"
                                        )}
                                    >
                                        <div className="shrink-0">
                                            {m.is_completed ? (
                                                <CheckCircle2 className="w-5 h-5" />
                                            ) : (
                                                <Circle className="w-5 h-5 text-black/10 group-hover/m:text-black/20" />
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-sm font-bold tracking-tight",
                                            m.is_completed && "line-through opacity-60"
                                        )}>
                                            {m.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
