'use client'

import { useState } from 'react'
import { Clock, Coffee, ShowerHead as ShowerHeadIcon, Bed, Dumbbell, Utensils, Zap, Settings2, Activity } from 'lucide-react'
import { useDayPlanner } from '../hooks/useDayPlanner'
import { cn } from '@/lib/utils'

export function DayPlanner() {
    const { settings, loading, plannerItems, updateSettings, isWorkDay } = useDayPlanner()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    if (loading) {
        return <div className="p-8 text-center text-black/40 font-bold uppercase tracking-widest text-[12px]">Generating your schedule...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[18px] font-bold text-black tracking-tight">Operations Blueprint</h2>
                    <p className="text-[12px] text-black/40">Your optimized deployment for this {isWorkDay ? 'Work Day' : 'Day Off'}.</p>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={cn(
                        "p-2 rounded-xl border transition-all",
                        isSettingsOpen ? "bg-black text-white border-black" : "bg-white text-black/40 border-black/10 hover:border-black/20"
                    )}
                >
                    <Settings2 className="w-4 h-4" />
                </button>
            </div>

            {isSettingsOpen && (
                <div className="p-6 rounded-2xl border border-black/10 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <h3 className="text-[14px] font-bold text-black uppercase tracking-tight mb-4">Routine Settings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-black/30 uppercase tracking-widest">Shift Days</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] font-medium text-black/60">Wake Up</span>
                                <input
                                    type="time"
                                    value={settings.wake_up_time_work}
                                    onChange={(e) => updateSettings({ wake_up_time_work: e.target.value })}
                                    className="bg-black/[0.03] border border-black/5 rounded-lg px-2 py-1 text-[12px] font-bold"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] font-medium text-black/60">Bed Time</span>
                                <input
                                    type="time"
                                    value={settings.bed_time_work}
                                    onChange={(e) => updateSettings({ bed_time_work: e.target.value })}
                                    className="bg-black/[0.03] border border-black/5 rounded-lg px-2 py-1 text-[12px] font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-black/30 uppercase tracking-widest">Days Off</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] font-medium text-black/60">Wake Up</span>
                                <input
                                    type="time"
                                    value={settings.wake_up_time_off}
                                    onChange={(e) => updateSettings({ wake_up_time_off: e.target.value })}
                                    className="bg-black/[0.03] border border-black/5 rounded-lg px-2 py-1 text-[12px] font-bold"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] font-medium text-black/60">Bed Time</span>
                                <input
                                    type="time"
                                    value={settings.bed_time_off}
                                    onChange={(e) => updateSettings({ bed_time_off: e.target.value })}
                                    className="bg-black/[0.03] border border-black/5 rounded-lg px-2 py-1 text-[12px] font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative space-y-4 before:absolute before:left-[18px] before:top-2 before:bottom-2 before:w-px before:bg-black/5">
                {plannerItems.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center relative group">
                        <div className={cn(
                            "w-9 h-9 rounded-full border border-black/5 flex items-center justify-center bg-white z-10 shrink-0 shadow-sm transition-transform group-hover:scale-110",
                            item.type === 'shift' ? "bg-blue-50 border-blue-100 text-blue-600" :
                                item.type === 'task' ? "bg-black text-white" :
                                    "text-black/40"
                        )}>
                            {getIcon(item.id, item.type)}
                        </div>
                        <div className={cn(
                            "flex-1 p-4 rounded-2xl border bg-white shadow-sm transition-all group-hover:border-black/20",
                            item.type === 'shift' && "border-blue-100 bg-blue-50/10",
                            item.type === 'task' && item.is_completed && "opacity-50 grayscale"
                        )}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-[14px] font-bold text-black tracking-tight">{item.title}</h3>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/[0.03] border border-black/5">
                                    <Clock className="w-3 h-3 text-black/30" />
                                    <span className="text-[11px] font-bold text-black/60">{item.time}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function getIcon(id: string, type: string) {
    if (type === 'shift') return <Zap className="w-4 h-4" />
    if (type === 'task') return <Activity className="w-4 h-4" />

    // IDs from useDayPlanner
    if (id === 'wake') return <Coffee className="w-4 h-4" />
    if (id === 'shower') return <ShowerHeadIcon className="w-4 h-4" />
    if (id === 'breakfast' || id === 'lunch' || id === 'dinner') return <Utensils className="w-4 h-4" />
    if (id === 'sleep') return <Bed className="w-4 h-4" />
    if (id.includes('gym') || id.includes('workout')) return <Dumbbell className="w-4 h-4" />

    return <Clock className="w-4 h-4" />
}

