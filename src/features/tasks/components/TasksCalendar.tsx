'use client'

import { useState, useMemo } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Clock, Briefcase } from 'lucide-react'
import { useSchedule, ScheduleItem } from '@/hooks/useSchedule'
import { cn } from '@/lib/utils'
import { useTasks } from '../hooks/useTasks'
import { Plus, X as CloseIcon } from 'lucide-react'

export function TasksCalendar() {
    const [calMonth, setCalMonth] = useState(() => {
        const d = new Date()
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        return d
    })
    const [selectedQuickAdd, setSelectedQuickAdd] = useState<{ day: number, date: Date } | null>(null)
    const [quickAddTitle, setQuickAddTitle] = useState('')
    const { createTask } = useTasks('todo')

    const { schedule, loading } = useSchedule(60) // Fetch 60 days to cover month views
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const calendarData = useMemo(() => {
        const year = calMonth.getFullYear()
        const month = calMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        // Map day number → items
        const byDay: Record<number, ScheduleItem[]> = {}
        schedule.forEach(item => {
            const itemDate = item.date
            if (itemDate.getMonth() === month && itemDate.getFullYear() === year) {
                const d = itemDate.getDate()
                if (!byDay[d]) byDay[d] = []
                byDay[d].push(item)
            }
        })

        return {
            byDay,
            daysInMonth: lastDay.getDate(),
            startDow: firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Monday = 0
        }
    }, [calMonth, schedule])

    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!quickAddTitle.trim() || !selectedQuickAdd) return

        try {
            await createTask(quickAddTitle.trim(), 'low', selectedQuickAdd.date.toISOString().split('T')[0])
            setQuickAddTitle('')
            setSelectedQuickAdd(null)
        } catch (err) {
            console.error(err)
        }
    }

    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return (
        <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-sm">
            <div className="p-5 border-b border-black/[0.04] flex items-center justify-between bg-black/[0.01]">
                <h2 className="text-[16px] font-bold text-black flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Focus Schedule
                </h2>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCalMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n })}
                            className="p-1.5 rounded-lg hover:bg-black/5 text-black/40"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[13px] font-bold text-black min-w-[120px] text-center">
                            {calMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                            onClick={() => setCalMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n })}
                            className="p-1.5 rounded-lg hover:bg-black/5 text-black/40"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-7 mb-2">
                    {DAY_LABELS.map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-black/25 uppercase tracking-wider py-2">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-black/[0.05] rounded-xl overflow-hidden border border-black/[0.05]">
                    {Array.from({ length: calendarData.startDow }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white min-h-[80px] sm:min-h-[110px]" />
                    ))}

                    {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                        const day = i + 1
                        const items = calendarData.byDay[day] || []
                        const isToday = today.getDate() === day &&
                            today.getMonth() === calMonth.getMonth() &&
                            today.getFullYear() === calMonth.getFullYear()
                        const isPast = new Date(calMonth.getFullYear(), calMonth.getMonth(), day) < today

                        return (
                            <div
                                key={day}
                                onClick={() => {
                                    const d = new Date(calMonth.getFullYear(), calMonth.getMonth(), day)
                                    setSelectedQuickAdd({ day, date: d })
                                }}
                                className={cn(
                                    "bg-white min-h-[80px] sm:min-h-[110px] p-1.5 flex flex-col gap-1 transition-all relative cursor-pointer hover:bg-black/[0.02]",
                                    isPast && !isToday && "bg-black/[0.01] opacity-60"
                                )}
                            >
                                <span className={cn(
                                    "text-[10px] sm:text-[12px] font-bold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mb-1",
                                    isToday ? "bg-black text-white" : "text-black/30"
                                )}>
                                    {day}
                                </span>

                                <div className="space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[80px] custom-scrollbar">
                                    {items.map((item, idx) => (
                                        <div
                                            key={item.id + idx}
                                            className={cn(
                                                "text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold border truncate",
                                                item.type === 'shift' && "bg-blue-50 text-blue-700 border-blue-100",
                                                item.type === 'overtime' && "bg-orange-50 text-orange-700 border-orange-100",
                                                item.type === 'holiday' && "bg-purple-50 text-purple-700 border-purple-100",
                                                item.type === 'task' && (item.is_completed ? "bg-emerald-50 text-emerald-600 border-emerald-100 opacity-50" : "bg-black text-white border-black")
                                            )}
                                        >
                                            {item.type === 'shift' ? 'Work' : item.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}

                    {/* Trailing empty cells */}
                    {Array.from({ length: (7 - (calendarData.startDow + calendarData.daysInMonth) % 7) % 7 }).map((_, i) => (
                        <div key={`empty-end-${i}`} className="bg-white min-h-[80px] sm:min-h-[110px]" />
                    ))}
                </div>

                {/* Quick Add Overlay */}
                {selectedQuickAdd && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white border border-black/10 rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[14px] font-bold text-black uppercase tracking-tight">
                                    Map task to {selectedQuickAdd.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </h3>
                                <button onClick={() => setSelectedQuickAdd(null)} className="p-1 hover:bg-black/5 rounded-lg text-black/40">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <form onSubmit={handleQuickAdd} className="space-y-4">
                                <input
                                    autoFocus
                                    type="text"
                                    value={quickAddTitle}
                                    onChange={(e) => setQuickAddTitle(e.target.value)}
                                    placeholder="Task title..."
                                    className="w-full bg-black/[0.03] border border-black/5 rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:border-black/20 focus:bg-white transition-all transition-colors"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={!quickAddTitle.trim()}
                                        className="flex-1 bg-black text-white rounded-xl py-3 text-[12px] font-bold uppercase tracking-widest hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        Add to Schedule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-6 p-4 bg-black/[0.02] rounded-xl border border-black/[0.04]">
                    <LegendItem color="bg-black" label="Tasks" />
                    <LegendItem color="bg-blue-500" label="Work Shift" />
                    <LegendItem color="bg-orange-500" label="Overtime" />
                    <LegendItem color="bg-purple-500" label="Holiday" />
                    <LegendItem color="bg-emerald-500" label="Completed" opacity />
                </div>
            </div>
        </div>
    )
}

function LegendItem({ color, label, opacity }: { color: string, label: string, opacity?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", color, opacity && "opacity-40")} />
            <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{label}</span>
        </div>
    )
}
