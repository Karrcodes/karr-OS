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
        <div className="flex flex-col h-full bg-white">
            {/* Standard Module Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-white flex-shrink-0 shadow-sm z-10 gap-4 lg:gap-0">
                <div>
                    <h1 className="text-[22px] font-bold text-black tracking-tight">Strategic Objectives</h1>
                    <p className="text-[12px] text-black/35 mt-0.5">Strategic Module · Objectives & Milestones</p>
                </div>

                <div className="flex items-center gap-3">
                    <GoalsViewSwitcher currentView={view} onViewChange={setView} />

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl font-bold text-[12px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                        Initiate Mission
                    </button>
                </div>
            </div>

            {/* Scrollable Workspace */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#fafafa]">
                <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white border border-black/[0.06] p-4 rounded-2xl shadow-sm">
                        <div className="relative flex-1 w-full text-black">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                            <input
                                type="text"
                                placeholder="Search strategy..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/[0.02] border-transparent focus:bg-white focus:border-black/5 rounded-xl pl-11 pr-4 py-3 text-sm font-bold placeholder:text-black/20 outline-none transition-all placeholder:font-bold"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                            <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black/30 border-r border-black/5 mr-1">
                                <Filter className="w-3.5 h-3.5" />
                                Filter
                            </div>
                            {['finance', 'career', 'health', 'personal'].map((cat) => (
                                <button
                                    key={cat}
                                    className="whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black/[0.03] text-black/40 hover:bg-black hover:text-white transition-all border border-transparent hover:border-black/10"
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Viewport */}
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="pb-20"
                    >
                        {view === 'matrix' && <GoalsMatrix goals={filteredGoals} onGoalClick={setSelectedGoal} />}
                        {view === 'timeline' && <GoalsTimeline goals={filteredGoals} onGoalClick={setSelectedGoal} />}
                        {view === 'vision' && <GoalsVisionBoard goals={filteredGoals} onGoalClick={setSelectedGoal} />}
                    </motion.div>
                </div>
            </div>

            {/* Overlays */}
            <GoalCreationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={createGoal}
            />

            {selectedGoal && (
                <GoalDetailSheet
                    goal={selectedGoal}
                    isOpen={!!selectedGoal}
                    onClose={() => setSelectedGoal(null)}
                    onToggleMilestone={toggleMilestone}
                    onDeleteGoal={deleteGoal}
                    onUpdateGoal={updateGoal}
                />
            )}
        </div>
    )
}
