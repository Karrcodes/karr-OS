'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Coffee, ShowerHead as ShowerHeadIcon, Bed, Dumbbell, Utensils, Zap, Settings2, Activity, Play, CheckCircle2, AlertCircle, Bus, MapPin, Footprints, Moon, Star, Sparkles, AlertTriangle, RefreshCw, Bell, Check, Pause, BedDouble, Calendar, X, CalendarDays } from 'lucide-react'
import { usePlannerEngine, PlannerItem } from '../hooks/usePlannerEngine'
import { getNextOffPeriod, isShiftDay } from '@/features/finance/utils/rotaUtils'
import { cn } from '@/lib/utils'

const isPast = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const now = new Date()
    const itemTime = new Date()
    itemTime.setHours(hours, minutes, 0, 0)
    return now > itemTime
}

const addMinsToTime = (timeStr: string, mins: number): string => {
    const [h, m] = timeStr.split(':').map(Number)
    const total = h * 60 + m + mins
    const hh = Math.floor(total / 60) % 24
    const mm = total % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const PRIORITY_PILL: Record<string, string> = {
    urgent: 'bg-purple-100 text-purple-700',
    high: 'bg-red-100 text-red-700',
    mid: 'bg-yellow-100 text-yellow-700',
    low: 'bg-black/5 text-black/40',
}

function NowIndicator({ plannerItems }: { plannerItems: PlannerItem[] }) {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const currentTimeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    const calculateTopOffset = () => {
        let totalHeight = 24 // initial top padding
        const currentMins = now.getHours() * 60 + now.getMinutes()

        for (const item of plannerItems) {
            const [h, m] = item.time.split(':').map(Number)
            const itemStartMins = h * 60 + m

            if (currentMins >= itemStartMins + item.duration) {
                // Item is fully in the past
                totalHeight += Math.max(80, item.duration * 1.5) + 32
            } else if (currentMins >= itemStartMins) {
                // Item is currently happening, add proportional height
                const itemHeight = Math.max(80, item.duration * 1.5)
                const progress = (currentMins - itemStartMins) / item.duration
                totalHeight += (itemHeight * progress) + 16 // 16px to reach top of card
                break // Stop adding height once we reach the current item
            } else {
                break // We haven't reached this item yet
            }
        }
        return totalHeight
    }

    const topOffset = calculateTopOffset()

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: topOffset }}
            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
            style={{ top: 0 }}
        >
            {/* Push pill fully right, outside item cards */}
            <div className="flex items-center w-full justify-end gap-2 pr-2">
                <div className="flex-1 h-[1.5px] bg-gradient-to-l from-rose-400 to-transparent opacity-40" />
                <span className="text-[10px] font-black text-rose-500 tabular-nums bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shadow-sm z-10 shrink-0">
                    {currentTimeStr}
                </span>
            </div>
        </motion.div>
    )
}

function RescheduleModal({ task, onClose, onConfirm }: { task: PlannerItem, onClose: () => void, onConfirm: (date: Date) => void }) {
    // Generate tomorrow's date to ensure "Next Available" is strictly in the future
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const nextOff = getNextOffPeriod(tomorrow).start
    const [selectedDateStr, setSelectedDateStr] = useState(
        nextOff.toISOString().split('T')[0]
    )

    const targetDate = new Date(selectedDateStr)
    const isTargetWorkday = isShiftDay(targetDate)

    // Check if it's deep work or long duration
    const isDeepWork = task.strategic_category?.toLowerCase().includes('deep') || task.duration > 60

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl overflow-hidden"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                    <X className="w-4 h-4 text-black/50" />
                </button>

                <h3 className="text-xl font-bold text-black mb-1 pr-10">Reschedule</h3>
                <p className="text-[13px] text-black/40 font-medium mb-6 truncate">{task.title}</p>

                <div className="space-y-4">
                    <button
                        onClick={() => setSelectedDateStr(nextOff.toISOString().split('T')[0])}
                        className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                            selectedDateStr === nextOff.toISOString().split('T')[0]
                                ? "border-blue-500 bg-blue-50/50"
                                : "border-black/5 hover:border-black/10 hover:bg-black/[0.02]"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            selectedDateStr === nextOff.toISOString().split('T')[0]
                                ? "bg-blue-100 text-blue-600"
                                : "bg-black/5 text-black/40"
                        )}>
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[13px] font-bold text-black">Next Available Off-Day</div>
                            <div className="text-[11px] text-black/40 uppercase tracking-widest font-black mt-0.5">
                                {nextOff.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                        </div>
                    </button>

                    <div className="p-4 rounded-2xl border-2 border-black/5 bg-black/[0.01]">
                        <div className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-3">Custom Date</div>
                        <input
                            type="date"
                            value={selectedDateStr}
                            onChange={(e) => setSelectedDateStr(e.target.value)}
                            className="w-full min-w-0 appearance-none flex flex-row items-center box-border bg-white border border-black/10 rounded-xl px-4 py-3 text-[12px] sm:text-[14px] font-medium text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                            required
                        />
                    </div>

                    <AnimatePresence>
                        {isTargetWorkday && isDeepWork && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div className="text-[12px] leading-relaxed text-amber-800">
                                        <span className="font-bold block mb-1">High Workload Warning</span>
                                        This is a work day. For tasks of this size ({task.duration}m), consider chunking or moving to your next available day off to prevent burnout.
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-8 pt-6 border-t border-black/5">
                    <button
                        onClick={() => onConfirm(targetDate)}
                        className="w-full py-4 bg-black text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
                    >
                        Confirm Reschedule
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export function DayPlanner() {
    const { settings, loading, plannerItems, reminders, initializeDay, reinitializeDay, endDay, initialization, isWorkDay, startTask, completeTask, rescheduleTask, isFlowActive, toggleFlow, updateSettings } = usePlannerEngine()
    const [activeTab, setActiveTab] = useState<'timeline' | 'settings'>('timeline')
    const [rescheduleData, setRescheduleData] = useState<PlannerItem | null>(null)

    if (loading) {
        return (
            <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                <p className="text-[12px] font-bold text-black/40 uppercase tracking-widest">Plotting your optimal day...</p>
            </div>
        )
    }

    if (!initialization && !isWorkDay && !settings?.chill_mode_active && activeTab === 'timeline') {
        return (
            <div className="p-8 rounded-[32px] border border-dashed border-black/10 bg-black/[0.01] flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-black/20" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-[20px] font-bold text-black tracking-tight">Day Not Initialized</h3>
                    <p className="text-[14px] text-black/40 max-w-[260px]">The engine is waiting for your T-Zero. Ready to start your day?</p>
                </div>
                <button
                    onClick={initializeDay}
                    className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-[12px] shadow-xl shadow-black/20 transition-all hover:scale-105 active:scale-95 group"
                >
                    <Play className="w-4 h-4 fill-white group-hover:animate-pulse" />
                    Initialize Day
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h1 className="text-lg font-bold text-black flex items-center gap-2">
                    <span>📅</span> Day Planner
                </h1>
                <p className="text-[12px] text-black/40 font-medium">Strategic execution timeline</p>
            </div>

            <div className="flex items-center justify-between px-2 mb-8">
                <div className="flex bg-black/5 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                            activeTab === 'timeline' ? "bg-white text-black shadow-sm" : "text-black/40"
                        )}
                    >
                        Timeline
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                            activeTab === 'settings' ? "bg-white text-black shadow-sm" : "text-black/40"
                        )}
                    >
                        Rules
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {initialization && !isWorkDay && (
                        <button
                            onClick={reinitializeDay}
                            className="p-2 rounded-xl bg-black/5 hover:bg-black hover:text-white text-black/40 transition-all group"
                            title="Re-initialize from now"
                        >
                            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    )}
                    {initialization && (
                        <button
                            onClick={endDay}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-100"
                            title="End Day — go to sleep"
                        >
                            <BedDouble className="w-3.5 h-3.5" />
                            End Day
                        </button>
                    )}
                    {!settings?.chill_mode_active && (
                        <button
                            onClick={toggleFlow}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                isFlowActive
                                    ? "bg-black text-white border-black animate-pulse ring-4 ring-black/10"
                                    : "bg-white text-black/40 border-black/5 hover:border-black/20"
                            )}
                        >
                            <Zap className={cn("w-3.5 h-3.5", isFlowActive && "fill-current")} />
                            {isFlowActive ? 'In Flow' : 'Flow Mode'}
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'timeline' ? (
                <div className="space-y-2 relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[55px] top-6 bottom-6 w-px bg-gradient-to-b from-black/5 via-black/[0.06] to-black/5" />

                    {/* Now Indicator */}
                    <NowIndicator plannerItems={plannerItems} />

                    {/* Reminders */}
                    {reminders && reminders.length > 0 && (
                        <div className="px-2 mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[14px] font-black text-black uppercase tracking-tight">Today's Reminders</h3>
                                </div>
                                <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">{reminders.length} Pending</span>
                            </div>
                            <div className="grid gap-2">
                                {reminders.map(reminder => (
                                    <div key={reminder.id} className="group flex items-center gap-3 p-3 bg-white border border-black/5 rounded-2xl hover:border-black/10 transition-all shadow-sm">
                                        <button
                                            onClick={() => completeTask(reminder.id)}
                                            className="w-6 h-6 rounded-lg border-2 border-black/10 hover:border-black/30 transition-all flex items-center justify-center text-transparent hover:text-black/20"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-bold text-black truncate">{reminder.title}</span>
                                                {reminder.priority && (
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                                        reminder.priority === 'urgent' ? "bg-rose-500 text-white" :
                                                            reminder.priority === 'high' ? "bg-amber-500 text-white" :
                                                                "bg-black/5 text-black/40"
                                                    )}>
                                                        {reminder.priority}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {plannerItems.length > 0 ? (
                        (plannerItems as PlannerItem[]).map((item, idx) => {
                            const endTime = item.end_time || addMinsToTime(item.time, item.duration)
                            const isTask = item.type === 'task'

                            return (
                                <div key={item.id} className="flex gap-3 group">
                                    {/* Left time column: start aligned strictly to top, end aligned strictly to bottom of card */}
                                    <div className="w-14 shrink-0 flex flex-col justify-between items-end pr-3">
                                        <span className={cn(
                                            "text-[10px] font-black tabular-nums transition-colors duration-500 pt-1.5",
                                            isPast(item.time) && !item.is_completed ? "text-black/15" : "text-black/25"
                                        )}>{item.time}</span>
                                        <span className={cn(
                                            "text-[10px] font-black tabular-nums transition-colors duration-500 pb-1.5",
                                            isPast(item.time) && !item.is_completed ? "text-black/10" : "text-black/15"
                                        )}>{endTime}</span>
                                    </div>

                                    {/* Card */}
                                    <div className="relative flex-1 pb-3">
                                        <div className={cn(
                                            "p-4 rounded-[20px] border border-black/[0.06] bg-white shadow-sm transition-all duration-500 relative overflow-hidden",
                                            item.type === 'shift' && "bg-blue-50/30 border-blue-100",
                                            item.type === 'transit' && "bg-amber-50/20 border-amber-100",
                                            item.is_stalled && "border-amber-400 bg-amber-50/30 ring-2 ring-amber-500/20",
                                            item.is_active && "border-rose-400 bg-rose-50/10 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/10",
                                            item.is_current && !item.is_active && "border-rose-200 ring-1 ring-rose-200",
                                            isPast(item.time) && !item.is_completed && !item.is_active && !item.is_current && "opacity-35 grayscale-[0.5]"
                                        )}>
                                            {/* Animated glow for active */}
                                            {item.is_active && (
                                                <motion.div
                                                    layoutId="active-glow"
                                                    className="absolute inset-0 bg-rose-500/5 animate-pulse"
                                                />
                                            )}

                                            {/* Pills row */}
                                            {isTask && (item.profile || item.priority || item.strategic_category) && (
                                                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                                                    {item.profile && (
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                            item.profile === 'business' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                                                        )}>
                                                            {item.profile}
                                                        </span>
                                                    )}
                                                    {item.priority && (
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                                            PRIORITY_PILL[item.priority] || 'bg-black/5 text-black/40'
                                                        )}>
                                                            {item.priority}
                                                        </span>
                                                    )}
                                                    {item.strategic_category && (
                                                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-black/5 text-black/50">
                                                            {item.strategic_category}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                        item.class === 'A' ? "bg-black text-white" :
                                                            item.class === 'B' ? "bg-blue-50 text-blue-600" :
                                                                "bg-amber-50 text-amber-600"
                                                    )}>
                                                        {getIcon(item.id, item.type, item.is_stalled)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-[14px] font-bold text-black tracking-tight leading-tight">{item.title}</h3>
                                                            {item.is_stalled && (
                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] font-black animate-pulse">
                                                                    <AlertTriangle className="w-2 h-2 fill-white" />
                                                                    STALLED
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Duration + impact */}
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-bold text-black/25 tabular-nums">
                                                                {item.time} — {endTime}
                                                            </span>
                                                            {isTask && item.impact_score && (
                                                                <span className="text-[10px] font-black text-amber-600 flex items-center gap-0.5">
                                                                    <Zap className="w-3 h-3 fill-current" />
                                                                    {item.impact_score}
                                                                </span>
                                                            )}
                                                            {item.class === 'A' && <span className="text-[8px] px-1 bg-black text-white rounded font-black">RIGID</span>}
                                                        </div>
                                                        {item.location && (
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-black/35">
                                                                <MapPin className="w-3 h-3" />
                                                                <span className="truncate max-w-[160px]">{item.location}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                {isTask && !item.is_completed && (
                                                    <div className="flex gap-1.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                startTask(item.id)
                                                            }}
                                                            className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                                                item.is_active
                                                                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                                                                    : "bg-black/5 hover:bg-black text-black/50 hover:text-white"
                                                            )}
                                                        >
                                                            {item.is_active ? (
                                                                <Pause className="w-3.5 h-3.5 fill-current" />
                                                            ) : (
                                                                <Play className="w-3.5 h-3.5 fill-current" />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setRescheduleData(item)
                                                            }}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-blue-500 text-black/50 hover:text-white transition-all"
                                                            title="Reschedule to Tomorrow"
                                                        >
                                                            <Calendar className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                completeTask(item.id)
                                                            }}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-green-500 text-black/50 hover:text-white transition-all"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}

                                                {item.is_completed && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 shrink-0">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Done</span>
                                                    </div>
                                                )}
                                            </div>

                                            {isPast(item.time) && !item.is_completed && isTask && !item.is_active && (
                                                <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/[0.03] border border-black/[0.05]">
                                                    <AlertCircle className="w-3 h-3 text-black/30" />
                                                    <span className="text-[9px] font-bold text-black/30 uppercase tracking-tight">Time passed — will reschedule</span>
                                                </div>
                                            )}
                                            {/* End timestamp */}
                                            <div className="flex justify-end mt-2">
                                                <span className="text-[9px] font-black text-black/15 tabular-nums uppercase tracking-widest">
                                                    ↑ {endTime}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-12 opacity-40">
                            <Sparkles className="w-8 h-8 text-black/20" />
                            <p className="text-[12px] font-bold text-black uppercase tracking-widest">Day Clear</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                    {/* Mode Toggle */}
                    <div className="px-2">
                        <button
                            onClick={() => {/* Update Chill Mode Logic */ }}
                            className={cn(
                                "w-full p-6 rounded-[32px] border-2 flex items-center justify-between transition-all",
                                settings?.chill_mode_active
                                    ? "bg-amber-500 border-amber-600 shadow-lg shadow-amber-500/20"
                                    : "bg-white border-black/5 hover:border-black/10"
                            )}
                        >
                            <div className="flex items-center gap-4 text-left">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                                    settings?.chill_mode_active ? "bg-white/20 text-white" : "bg-amber-50 text-amber-500"
                                )}>
                                    <Coffee className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className={cn("text-[16px] font-black tracking-tight", settings?.chill_mode_active ? "text-white" : "text-black")}>Chill Mode</h3>
                                    <p className={cn("text-[12px] font-bold opacity-60", settings?.chill_mode_active ? "text-white" : "text-black/40")}>Suspends algorithmic scaling today</p>
                                </div>
                            </div>
                            <div className={cn(
                                "w-12 h-6 rounded-full relative transition-colors",
                                settings?.chill_mode_active ? "bg-white/40" : "bg-black/10"
                            )}>
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                    settings?.chill_mode_active ? "left-7" : "left-1"
                                )} />
                            </div>
                        </button>
                    </div>

                    {/* Section: Routines */}
                    <div className="space-y-4 px-2">
                        <div className="flex items-center gap-2 px-4">
                            <Star className="w-4 h-4 text-black/40" />
                            <h3 className="text-[12px] font-black text-black uppercase tracking-widest">Routine Defaults</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { id: 'gym', label: 'Gym Session', duration: settings?.routine_defaults?.gym.duration || 90, icon: <Dumbbell className="w-4 h-4" /> },
                                { id: 'walk', label: 'Recovery Walk', duration: settings?.routine_defaults?.walk.duration || 30, icon: <Footprints className="w-4 h-4" /> },
                                { id: 'meal', label: 'Meal Prep', duration: settings?.routine_defaults?.meal_prep.duration || 45, icon: <Utensils className="w-4 h-4" /> }
                            ].map((routine) => (
                                <div key={routine.id} className="p-6 rounded-[32px] bg-white border border-black/5 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-black/[0.03] flex items-center justify-center text-black/40">
                                            {routine.icon}
                                        </div>
                                        <span className="text-[14px] font-bold text-black">{routine.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-black/5 p-1 rounded-xl">
                                        <input
                                            type="number"
                                            value={routine.duration}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                const routineKey = routine.id === 'meal' ? 'meal_prep' : routine.id;
                                                updateSettings({
                                                    routine_defaults: {
                                                        ...settings?.routine_defaults!,
                                                        [routineKey]: {
                                                            ...(settings?.routine_defaults as any)[routineKey],
                                                            duration: val
                                                        }
                                                    } as any
                                                });
                                            }}
                                            className="w-12 text-center bg-transparent text-[14px] font-black focus:outline-none"
                                        />
                                        <span className="text-[10px] font-black text-black/20 uppercase pr-2">Min</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {rescheduleData && (
                    <RescheduleModal
                        task={rescheduleData}
                        onClose={() => setRescheduleData(null)}
                        onConfirm={(date: Date) => {
                            rescheduleTask(rescheduleData.id, date)
                            setRescheduleData(null)
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function getIcon(id: string, type: string, isStalled?: boolean) {
    if (isStalled) return <AlertTriangle className="w-4 h-4 text-white" />
    if (type === 'shift') return <Zap className="w-4 h-4" />
    if (type === 'transit') return <Bus className="w-4 h-4" />
    if (type === 'task') return <Activity className="w-4 h-4" />

    if (id.includes('wake')) return <Coffee className="w-4 h-4" />
    if (id.includes('shower')) return <ShowerHeadIcon className="w-4 h-4" />
    if (id.includes('meal') || id.includes('break') || id.includes('oats')) return <Utensils className="w-4 h-4" />
    if (id.includes('sleep')) return <Moon className="w-4 h-4" />
    if (id.includes('gym') || id.includes('workout')) return <Dumbbell className="w-4 h-4" />

    return <Clock className="w-4 h-4" />
}
