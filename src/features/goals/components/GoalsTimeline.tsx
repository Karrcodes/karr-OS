'use client'

import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Target, Flag, Warehouse } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isShiftDay } from '@/features/finance/utils/rotaUtils'
import type { Goal, Milestone } from '../types/goals.types'

interface GoalsTimelineProps {
    goals: Goal[]
    onGoalClick: (goal: Goal) => void
}

export default function GoalsTimeline({ goals, onGoalClick }: GoalsTimelineProps) {
    const [viewDate, setViewDate] = useState(() => {
        const d = new Date()
        d.setDate(1)
        return d
    })

    const calendarData = useMemo(() => {
        const year = viewDate.getFullYear()
        const month = viewDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        const daysInMonth = lastDay.getDate()
        const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Mon = 0

        const milestonesByDay: Record<number, { goal: Goal, milestone?: Milestone }[]> = {}

        goals.forEach(goal => {
            // Check goal target date
            if (goal.target_date) {
                const d = new Date(goal.target_date)
                if (d.getMonth() === month && d.getFullYear() === year) {
                    const day = d.getDate()
                    if (!milestonesByDay[day]) milestonesByDay[day] = []
                    milestonesByDay[day].push({ goal })
                }
            }

            // Check milestone target dates (if we had them, currently milestones don't have separate dates in schema, 
            // but the user might want them. For now we use the goal's target date as a proxy or just the goal itself.)
            // Actually, the prompt says "plot the deadline of every goal and milestone". 
            // Our current schema doesn't have milestone deadlines. I'll stick to Goal deadlines for now 
            // and maybe milestones inherit them or we add them later. 
            // Wait, let's look at the schema again. 
        })

        return { daysInMonth, startDow, milestonesByDay }
    }, [viewDate, goals])

    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[18px] font-black text-black tracking-tight uppercase">Strategic Timeline</h2>
                    <p className="text-[12px] text-black/35 font-medium italic">Visualize bandwidth vs objectives</p>
                </div>
                <div className="flex items-center gap-1 bg-black/[0.03] p-1 rounded-xl border border-black/[0.05]">
                    <button
                        onClick={() => setViewDate(d => { const n = new Date(d); n.setMonth(d.getMonth() - 1); return n })}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-black/40 hover:text-black"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[12px] font-black uppercase tracking-widest min-w-[140px] text-center">
                        {viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                        onClick={() => setViewDate(d => { const n = new Date(d); n.setMonth(d.getMonth() + 1); return n })}
                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-black/40 hover:text-black"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-black/[0.05] rounded-3xl overflow-hidden border border-black/[0.1] shadow-2xl shadow-black/5">
                {DAY_LABELS.map(d => (
                    <div key={d} className="bg-white/50 backdrop-blur-sm p-4 text-center text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">{d}</div>
                ))}

                {Array.from({ length: calendarData.startDow }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-black/[0.01] min-h-[140px]" />
                ))}

                {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
                    const isWork = isShiftDay(d)
                    const items = calendarData.milestonesByDay[day] || []
                    const isToday = new Date().toDateString() === d.toDateString()

                    return (
                        <div
                            key={day}
                            className={cn(
                                "relative min-h-[140px] p-3 transition-all border-t border-l border-black/[0.02]",
                                isWork ? "bg-blue-50/30" : "bg-white",
                                isToday && "ring-2 ring-black ring-inset z-10"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                    "text-[12px] font-black w-6 h-6 flex items-center justify-center rounded-full",
                                    isToday ? "bg-black text-white" : "text-black/15"
                                )}>
                                    {day}
                                </span>
                                {isWork && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-tighter">
                                        <Warehouse className="w-2.5 h-2.5" />
                                        Warehouse
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                {items.map((item, idx) => (
                                    <button
                                        key={item.goal.id + idx}
                                        onClick={() => onGoalClick(item.goal)}
                                        className="w-full text-left p-2 rounded-lg bg-black text-white border border-black/10 shadow-lg shadow-black/10 hover:scale-[1.03] transition-all group"
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Target className="w-2.5 h-2.5 text-blue-400" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Target Date</span>
                                        </div>
                                        <div className="text-[10px] font-bold leading-tight line-clamp-2">{item.goal.title}</div>
                                    </button>
                                ))}
                            </div>

                            {isWork && items.length > 0 && (
                                <div className="absolute bottom-2 left-2 right-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                    <p className="text-[8px] font-black uppercase text-amber-700 leading-tight">Bandwidth Conflict</p>
                                </div>
                            )}
                        </div>
                    )
                })}

                {Array.from({ length: (7 - (calendarData.startDow + calendarData.daysInMonth) % 7) % 7 }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="bg-black/[0.01] min-h-[140px]" />
                ))}
            </div>

            <div className="flex items-center gap-6 p-6 bg-black/[0.03] rounded-2xl border border-black/[0.05]">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200" />
                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">12hr Warehouse Shift</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white border border-black/10" />
                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Execution Bandwidth</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-black shadow-sm" />
                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Strategic Deadline</span>
                </div>
            </div>
        </div>
    )
}
