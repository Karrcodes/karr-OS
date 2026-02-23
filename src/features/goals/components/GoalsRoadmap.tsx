'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Circle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Goal } from '../types/goals.types'

interface GoalsRoadmapProps {
    goals: Goal[]
    onGoalClick: (goal: Goal) => void
}

interface MonthHeader {
    name: string       // e.g. "Feb"
    isNewYear: boolean // marks a year boundary
    yearLabel: string  // e.g. "2026"
    offset: number     // percentage offset 0-100
}

export default function GoalsRoadmap({ goals, onGoalClick }: GoalsRoadmapProps) {
    const timelineRef = useRef<HTMLDivElement>(null)

    const roadmapRange = useMemo(() => {
        const today = new Date()
        const start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
        const end = new Date(today.getFullYear(), today.getMonth() + 10, 0)

        const days: Date[] = []
        let current = new Date(start)
        while (current <= end) {
            days.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }

        const totalDays = days.length
        const diffToday = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        const todayOffset = (diffToday / totalDays) * 100

        const months: MonthHeader[] = []
        let lastMonth = -1
        let lastYear = -1
        days.forEach((date, idx) => {
            if (date.getMonth() !== lastMonth) {
                const isNewYear = date.getFullYear() !== lastYear && lastYear !== -1
                months.push({
                    name: date.toLocaleDateString('en-GB', { month: 'short' }),
                    isNewYear,
                    yearLabel: String(date.getFullYear()),
                    offset: (idx / totalDays) * 100
                })
                lastMonth = date.getMonth()
                lastYear = date.getFullYear()
            }
        })

        return { start, end, totalDays, todayOffset, months }
    }, [])

    useEffect(() => {
        if (timelineRef.current) {
            const container = timelineRef.current
            const scrollPos = (container.scrollWidth * roadmapRange.todayOffset / 100) - (container.clientWidth / 3)
            container.scrollLeft = scrollPos
        }
    }, [roadmapRange.todayOffset])

    const calculateGoalPos = (goal: Goal) => {
        const goalStart = new Date(goal.created_at)
        const goalEnd = goal.target_date ? new Date(goal.target_date) : new Date(roadmapRange.end)

        const startDiff = (goalStart.getTime() - roadmapRange.start.getTime()) / (1000 * 60 * 60 * 24)
        const endDiff = (goalEnd.getTime() - roadmapRange.start.getTime()) / (1000 * 60 * 60 * 24)

        const left = Math.max(0, (startDiff / roadmapRange.totalDays) * 100)
        const width = Math.min(100 - left, ((endDiff - startDiff) / roadmapRange.totalDays) * 100)

        return { left: `${left}%`, width: `${Math.max(width, 4)}%` }
    }

    // Fixed px-per-month so portrait doesn't squish — min 120px per month
    const MIN_PX_PER_MONTH = 120
    const totalMonths = roadmapRange.months.length
    const minTimelineWidth = Math.max(totalMonths * MIN_PX_PER_MONTH, 1400)

    return (
        <div className="flex flex-col h-full bg-white border border-black/[0.06] rounded-[24px] overflow-hidden shadow-sm">
            {/* Column Headers */}
            <div className="flex border-b border-black/[0.06] bg-black/[0.01]">
                <div className="w-[180px] md:w-[280px] shrink-0 p-4 border-r border-black/[0.06]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/30">Mission</span>
                </div>
                <div className="flex-1 relative overflow-hidden h-12">
                    {/* We mirror the timeline width for the header only */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div
                            className="h-full relative"
                            style={{ minWidth: `${minTimelineWidth}px` }}
                        >
                            {roadmapRange.months.map((m: MonthHeader, idx: number) => (
                                <div
                                    key={idx}
                                    className="absolute h-full border-l border-black/[0.04] flex flex-col justify-center px-2"
                                    style={{ left: `${m.offset}%` }}
                                >
                                    {m.isNewYear && (
                                        <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider leading-none mb-0.5">{m.yearLabel}</span>
                                    )}
                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-black/50 whitespace-nowrap">{m.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Fixed Sidebar */}
                <div className="w-[180px] md:w-[280px] shrink-0 flex flex-col border-r border-black/[0.06] bg-white divide-y divide-black/[0.03] overflow-y-auto no-scrollbar">
                    {goals.map(goal => (
                        <button
                            key={goal.id}
                            onClick={() => onGoalClick(goal)}
                            className="group h-[80px] w-full p-3 md:p-4 flex flex-col justify-center text-left hover:bg-black/[0.02] transition-colors overflow-hidden shrink-0"
                        >
                            <h4 className="text-[12px] md:text-[13px] font-bold text-black truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{goal.title}</h4>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest",
                                    goal.category === 'finance' ? "bg-emerald-50 text-emerald-600" :
                                        goal.category === 'career' ? "bg-blue-50 text-blue-600" :
                                            goal.category === 'health' ? "bg-rose-50 text-rose-600" :
                                                "bg-black/5 text-black/40"
                                )}>
                                    {goal.category}
                                </span>
                                {goal.priority === 'super' && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                )}
                            </div>
                        </button>
                    ))}
                    {goals.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <Target className="w-8 h-8 mb-2 text-black/10" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/15">No Active Missions</p>
                        </div>
                    )}
                </div>

                {/* Scrollable Timeline */}
                <div
                    ref={timelineRef}
                    className="flex-1 relative overflow-x-auto no-scrollbar bg-black/[0.005]"
                >
                    <div className="h-full relative" style={{ minWidth: `${minTimelineWidth}px` }}>
                        {/* Grid Lines */}
                        {roadmapRange.months.map((m: MonthHeader, idx: number) => (
                            <div
                                key={idx}
                                className={cn(
                                    "absolute top-0 bottom-0",
                                    m.isNewYear ? "border-l-2 border-blue-200" : "border-l border-black/[0.04]"
                                )}
                                style={{ left: `${m.offset}%` }}
                            />
                        ))}

                        {/* Today Indicator */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-blue-500 z-20 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                            style={{ left: `${roadmapRange.todayOffset}%` }}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded-b uppercase tracking-tight whitespace-nowrap">
                                Today
                            </div>
                        </div>

                        {/* Goal Bars */}
                        <div className="flex flex-col divide-y divide-black/[0.03]">
                            {goals.map(goal => {
                                const pos = calculateGoalPos(goal)
                                const milestones = goal.milestones || []
                                const completed = milestones.filter(m => m.is_completed).length
                                const progress = milestones.length > 0 ? (completed / milestones.length) * 100 : 0

                                return (
                                    <div key={goal.id} className="h-[80px] relative flex items-center shrink-0">
                                        <motion.div
                                            initial={{ opacity: 0, scaleX: 0 }}
                                            animate={{ opacity: 1, scaleX: 1 }}
                                            transition={{ duration: 0.4, ease: 'easeOut' }}
                                            className="absolute h-8 rounded-full border border-black/10 shadow-sm flex items-center px-3 overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-black/5 transition-shadow"
                                            style={{
                                                left: pos.left,
                                                width: pos.width,
                                                transformOrigin: 'left',
                                                backgroundColor: goal.status === 'completed' ? '#f0fdf4' : 'white'
                                            }}
                                            onClick={() => onGoalClick(goal)}
                                        >
                                            {/* Progress Fill */}
                                            <div
                                                className="absolute inset-y-0 left-0 bg-black opacity-[0.06] rounded-full"
                                                style={{ width: `${progress}%` }}
                                            />

                                            <div className="relative z-10 flex items-center justify-between w-full gap-2">
                                                <span className="text-[10px] font-bold uppercase tracking-tight truncate text-black/60">
                                                    {goal.title}
                                                </span>
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                    {milestones.slice(0, 4).map((m) => (
                                                        <div key={m.id} title={m.title}>
                                                            {m.is_completed
                                                                ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                                                : <Circle className="w-2.5 h-2.5 text-black/10" />
                                                            }
                                                        </div>
                                                    ))}
                                                    {milestones.length > 4 && (
                                                        <span className="text-[8px] font-bold text-black/20 ml-0.5">+{milestones.length - 4}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
