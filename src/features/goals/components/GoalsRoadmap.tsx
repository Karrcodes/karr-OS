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
    name: string
    isNewYear: boolean
    yearLabel: string
    offset: number // 0–100 percent of total timeline width
}

export default function GoalsRoadmap({ goals, onGoalClick }: GoalsRoadmapProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const roadmapRange = useMemo(() => {
        const today = new Date()
        const start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
        const end = new Date(today.getFullYear(), today.getMonth() + 10, 0)

        const days: Date[] = []
        let cur = new Date(start)
        while (cur <= end) {
            days.push(new Date(cur))
            cur.setDate(cur.getDate() + 1)
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

    // Minimum 120 px per month so portrait doesn't squish
    const minTimelineWidth = Math.max(roadmapRange.months.length * 120, 1400)

    // Auto-scroll to centre Today on mount
    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current
            const todayPx = (minTimelineWidth * roadmapRange.todayOffset) / 100
            el.scrollLeft = todayPx - el.clientWidth / 3
        }
    }, [roadmapRange.todayOffset, minTimelineWidth])

    const calcPos = (goal: Goal) => {
        const s = new Date(goal.created_at)
        const e = goal.target_date ? new Date(goal.target_date) : new Date(roadmapRange.end)
        const sd = (s.getTime() - roadmapRange.start.getTime()) / 86_400_000
        const ed = (e.getTime() - roadmapRange.start.getTime()) / 86_400_000
        const left = Math.max(0, (sd / roadmapRange.totalDays) * 100)
        const width = Math.min(100 - left, Math.max(4, ((ed - sd) / roadmapRange.totalDays) * 100))
        return { left: `${left}%`, width: `${width}%` }
    }

    return (
        <div className="flex h-full bg-white border border-black/[0.06] rounded-[24px] overflow-hidden shadow-sm">

            {/* ── Fixed Goal Sidebar ── */}
            <div className="w-[160px] md:w-[260px] shrink-0 flex flex-col border-r border-black/[0.06] bg-white overflow-hidden">
                {/* Sidebar Header */}
                <div className="h-10 flex items-center px-4 border-b border-black/[0.06] shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/30">Mission</span>
                </div>
                {/* Goal list */}
                <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-black/[0.03]">
                    {goals.map(goal => (
                        <button
                            key={goal.id}
                            onClick={() => onGoalClick(goal)}
                            className="group h-[64px] w-full px-3 md:px-4 flex flex-col justify-center text-left hover:bg-black/[0.02] transition-colors overflow-hidden shrink-0"
                        >
                            <h4 className="text-[11px] md:text-[12px] font-bold text-black truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-snug">
                                {goal.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1">
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
            </div>

            {/* ── Single unified scrollable column ── */}
            <div ref={scrollRef} className="flex-1 overflow-x-auto no-scrollbar overflow-y-hidden flex flex-col">
                {/* Inner wide container that everything shares */}
                <div className="flex flex-col" style={{ minWidth: `${minTimelineWidth}px`, height: '100%' }}>

                    {/* Month Header Row */}
                    <div className="h-10 relative border-b border-black/[0.06] bg-black/[0.01] shrink-0">
                        {/* Grid lines */}
                        {roadmapRange.months.map((m, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "absolute top-0 bottom-0",
                                    m.isNewYear ? "border-l-2 border-blue-200" : "border-l border-black/[0.04]"
                                )}
                                style={{ left: `${m.offset}%` }}
                            />
                        ))}
                        {/* Month labels */}
                        {roadmapRange.months.map((m, i) => (
                            <div
                                key={i}
                                className="absolute inset-y-0 flex flex-col justify-center px-2 pointer-events-none"
                                style={{ left: `${m.offset}%` }}
                            >
                                {m.isNewYear && (
                                    <span className="text-[8px] font-bold text-blue-400 uppercase leading-none mb-px">{m.yearLabel}</span>
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-tighter text-black/50 whitespace-nowrap">{m.name}</span>
                            </div>
                        ))}
                        {/* Today tick in header */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-blue-500"
                            style={{ left: `${roadmapRange.todayOffset}%` }}
                        />
                    </div>

                    {/* Goal Bars Area */}
                    <div className="flex-1 relative">
                        {/* Background grid lines */}
                        {roadmapRange.months.map((m, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "absolute top-0 bottom-0",
                                    m.isNewYear ? "border-l-2 border-blue-100" : "border-l border-black/[0.03]"
                                )}
                                style={{ left: `${m.offset}%` }}
                            />
                        ))}

                        {/* Today Line — inside the shared container, scrolls naturally */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-blue-500 z-10 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                            style={{ left: `${roadmapRange.todayOffset}%` }}
                        >
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded-full uppercase tracking-tight whitespace-nowrap shadow-sm">
                                Today
                            </div>
                        </div>

                        {/* Rows — one per goal, matches sidebar heights */}
                        {goals.map(goal => {
                            const pos = calcPos(goal)
                            const milestones = goal.milestones || []
                            const done = milestones.filter(m => m.is_completed).length
                            const progress = milestones.length ? (done / milestones.length) * 100 : 0

                            return (
                                <div key={goal.id} className="h-[64px] relative flex items-center border-b border-black/[0.03]">
                                    <motion.div
                                        initial={{ opacity: 0, scaleX: 0 }}
                                        animate={{ opacity: 1, scaleX: 1 }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                        className="absolute h-7 rounded-full border border-black/10 shadow-sm flex items-center px-3 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                        style={{
                                            left: pos.left,
                                            width: pos.width,
                                            transformOrigin: 'left',
                                            backgroundColor: goal.status === 'completed' ? '#f0fdf4' : 'white'
                                        }}
                                        onClick={() => onGoalClick(goal)}
                                    >
                                        {/* Progress fill */}
                                        <div
                                            className="absolute inset-y-0 left-0 bg-black/[0.05] rounded-full"
                                            style={{ width: `${progress}%` }}
                                        />
                                        <div className="relative z-10 flex items-center justify-between w-full gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-tight truncate text-black/60">
                                                {goal.title}
                                            </span>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                {milestones.slice(0, 4).map(m => (
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
    )
}
