'use client'

import { Calendar as CalendarIcon, Clock, ChevronRight, Briefcase, Activity } from 'lucide-react'
import { useSchedule, ScheduleItem } from '@/hooks/useSchedule'
import { cn } from '@/lib/utils'
import Link from 'next/link'

import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'

export function ScheduleWidget() {
    const { schedule, loading } = useSchedule(7, true) // Next 7 days, all profiles
    const { settings } = useSystemSettings()
    const today = new Date().toISOString().split('T')[0]

    return (
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-baseline gap-2">
                    <h2 className="text-[15px] font-bold text-black">Heads-up Schedule</h2>
                    <span className="text-[11px] text-black/35 font-medium">Next 7 Days</span>
                </div>
                <Link href="/tasks/calendar" className="text-[11px] font-bold text-black/40 hover:text-black uppercase tracking-widest transition-colors flex items-center gap-1">
                    Full View <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-14 bg-black/[0.02] rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : schedule.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CalendarIcon className="w-8 h-8 text-black/10 mb-2" />
                        <p className="text-[12px] text-black/30">Nothing scheduled for the week.</p>
                    </div>
                ) : (
                    schedule.map((item, idx) => {
                        const isToday = item.date.toISOString().split('T')[0] === today
                        return (
                            <div
                                key={item.id + idx}
                                className={cn(
                                    "group flex items-center gap-3 p-3 rounded-xl border transition-all",
                                    isToday
                                        ? "bg-black border-black text-white shadow-md shadow-black/10"
                                        : "bg-white border-black/[0.05] hover:border-black/[0.1] text-black"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                    isToday ? "bg-white/10" : "bg-black/[0.03]"
                                )}>
                                    {item.type === 'shift' || item.type === 'overtime' ? (
                                        <Briefcase className={cn("w-5 h-5", isToday ? "text-white" : "text-black/40")} />
                                    ) : (
                                        <Activity className={cn("w-5 h-5", isToday ? "text-white" : "text-black/40")} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[13px] font-bold truncate tracking-tight">{item.title}</h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={cn("text-[10px] uppercase font-bold tracking-wider", isToday ? "text-white/40" : "text-black/30")}>
                                            {item.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                        {item.type === 'overtime' && (
                                            <span className="bg-orange-500/10 text-orange-600 text-[9px] px-1 rounded font-bold uppercase">Overtime</span>
                                        )}
                                        {item.type === 'holiday' && (
                                            <span className="bg-purple-500/10 text-purple-600 text-[9px] px-1 rounded font-bold uppercase">Holiday</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-black/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-black/30 uppercase">
                        {settings.is_demo_mode ? 'Work Cycle Sync\'d' : 'Shift Cycle Sync\'d'}
                    </span>
                </div>
                <div className="text-[10px] font-mono text-black/20">v1.2.0</div>
            </div>
        </div>
    )
}
