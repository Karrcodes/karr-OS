'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Wallet, Briefcase, Heart, User, LayoutGrid, Calendar, Image as ImageIcon, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGoals } from '../hooks/useGoals'
import GoalCreationModal from './GoalCreationModal'
import GoalsViewSwitcher, { type GoalsView } from './GoalsViewSwitcher'
import GoalsMatrix from './GoalsMatrix'
import GoalsTimeline from './GoalsTimeline'
import GoalsVisionBoard from './GoalsVisionBoard'
import GoalDetailSheet from './GoalDetailSheet'
import type { Goal, GoalCategory } from '../types/goals.types'

export default function GoalsDashboard() {
    const { goals, loading, createGoal, toggleMilestone, deleteGoal, updateGoal } = useGoals()
    const [view, setView] = useState<GoalsView>('matrix')
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredGoals = useMemo(() => {
        return goals.filter(goal =>
            goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            goal.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [goals, searchQuery])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20">Parsing Strategy...</p>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 space-y-8 pb-32">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-[32px] font-black text-black tracking-tighter leading-none">Strategic Objectives</h1>
                    <p className="text-[14px] text-black/40 font-medium">Mission critical targets and tactical milestones.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <GoalsViewSwitcher currentView={view} onViewChange={setView} />

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        Initiate Mission
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white border border-black/[0.06] p-4 rounded-2xl shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                    <input
                        type="text"
                        placeholder="Search objectives..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/[0.02] border-transparent focus:bg-white focus:border-black/10 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-black/30 border-r border-black/5 mr-1">
                        <Filter className="w-3.5 h-3.5" />
                        Filter
                    </div>
                    {['finance', 'career', 'health', 'personal'].map((cat) => (
                        <button
                            key={cat}
                            className="whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-black/[0.03] text-black/40 hover:bg-black hover:text-white transition-all"
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Workspace Area */}
            <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {view === 'matrix' && <GoalsMatrix goals={filteredGoals} onGoalClick={setSelectedGoal} />}
                {view === 'timeline' && <GoalsTimeline goals={filteredGoals} onGoalClick={setSelectedGoal} />}
                {view === 'vision' && <GoalsVisionBoard goals={filteredGoals} onGoalClick={setSelectedGoal} />}
            </motion.div>

            {/* Overlays */}
            <GoalCreationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={createGoal}
            />

            <GoalDetailSheet
                goal={selectedGoal}
                isOpen={!!selectedGoal}
                onClose={() => setSelectedGoal(null)}
                onToggleMilestone={toggleMilestone}
                onDeleteGoal={deleteGoal}
                onUpdateGoal={updateGoal}
            />
        </div>
    )
}
