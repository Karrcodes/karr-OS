'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { Dumbbell, CheckCircle2, ChevronRight, X, Play, Pause, RotateCcw, Save, Trash2, ArrowRight, SkipForward, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export function WorkoutSession() {
    const { activeSession, updateSessionSet, finishSession, cancelSession, routines } = useWellbeing()
    const router = useRouter()
    const [elapsed, setElapsed] = useState(0)
    const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null)

    const routine = useMemo(() => 
        routines.find(r => r.id === activeSession?.routineId),
        [routines, activeSession?.routineId]
    )

    // Timer logic
    useEffect(() => {
        if (!activeSession || activeSession.isPaused) return
        
        const start = new Date(activeSession.startTime).getTime()
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - start) / 1000))
        }, 1000)
        
        return () => clearInterval(interval)
    }, [activeSession])

    if (!activeSession || !routine) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-20 h-20 rounded-full bg-black/5 flex items-center justify-center">
                    <Dumbbell className="w-10 h-10 text-black/20" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">No Active Session</h2>
                    <p className="text-black/40 text-sm font-bold uppercase">Start a routine from the fitness dashboard</p>
                </div>
                <button 
                    onClick={() => router.push('/health/fitness')}
                    className="px-8 py-4 bg-black text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                    Back to Dashboard
                </button>
            </div>
        )
    }

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const handleFinish = async () => {
        if (confirm('Finish this workout session?')) {
            await finishSession()
            router.push('/health/fitness')
        }
    }

    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel? Progress will be lost.')) {
            cancelSession()
            router.push('/health/fitness')
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header: Timer & Session Info */}
            <div className="bg-black text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <h3 className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em]">Live Session</h3>
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{routine.name}</h2>
                        <p className="text-white/40 text-[11px] font-black uppercase tracking-widest">
                            Started at {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Duration</p>
                            <p className="text-3xl font-black tabular-nums">{formatTime(elapsed)}</p>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div className="flex gap-3">
                             <button 
                                onClick={handleFinish}
                                className="px-6 py-4 bg-emerald-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center gap-2"
                             >
                                <CheckCircle2 className="w-4 h-4" /> Finish
                             </button>
                             <button 
                                onClick={handleCancel}
                                className="w-14 h-14 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-500/20 hover:border-rose-500/30 transition-all text-white/50 hover:text-rose-500"
                             >
                                <X className="w-5 h-5" />
                             </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-[11px] font-black text-black/30 uppercase tracking-[0.4em]">Protocol Pipeline</h3>
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">
                        {activeSession.exercises.length} Exercises Total
                    </p>
                </div>

                <div className="space-y-3">
                    {routine.exercises.map((ex, exIndex) => {
                        const exSession = activeSession.exercises.find(e => e.exerciseId === ex.id)
                        const isExpanded = expandedExerciseId === ex.id
                        const isCompleted = activeSession.completedExerciseIds.includes(ex.id)
                        const isSkipped = activeSession.skippedExerciseIds.includes(ex.id)

                        return (
                            <motion.div 
                                key={ex.id}
                                layout
                                className={cn(
                                    "bg-white border rounded-[32px] overflow-hidden transition-all",
                                    isExpanded ? "ring-2 ring-black border-transparent shadow-xl" : "border-black/5 hover:border-black/10 shadow-sm"
                                )}
                            >
                                <div 
                                    className="p-6 cursor-pointer flex items-center justify-between"
                                    onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                            isCompleted ? "bg-emerald-500 text-white" : isSkipped ? "bg-amber-500 text-white" : "bg-black/5 text-black"
                                        )}>
                                            {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase tracking-tight">{ex.name}</h4>
                                            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">
                                                Target: {ex.suggestedSets} Sets × {ex.suggestedReps} Reps
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="hidden sm:flex gap-1">
                                            {exSession?.sets.map((set, i) => (
                                                <div 
                                                    key={i} 
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full",
                                                        set.weight > 0 ? "bg-emerald-500" : "bg-black/10"
                                                    )} 
                                                />
                                            ))}
                                        </div>
                                        {isExpanded ? <ChevronUp className="w-5 h-5 text-black/20" /> : <ChevronDown className="w-5 h-5 text-black/20" />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-6 pb-6 pt-0 space-y-4 border-t border-black/5"
                                        >
                                            <div className="grid grid-cols-1 gap-2 pt-4">
                                                {exSession?.sets.map((set, setIndex) => (
                                                    <div 
                                                        key={setIndex}
                                                        className="flex items-center gap-4 p-3 bg-black/[0.02] rounded-2xl border border-black/5"
                                                    >
                                                        <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center text-[10px] font-black">
                                                            {setIndex + 1}
                                                        </div>
                                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black text-black/30 uppercase tracking-widest ml-1">Weight (kg)</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={set.weight}
                                                                    onChange={(e) => updateSessionSet(ex.id, setIndex, { weight: parseFloat(e.target.value) || 0 })}
                                                                    className="w-full bg-white border border-black/5 rounded-xl px-3 py-2 text-[12px] font-black focus:ring-2 ring-black/5 outline-none transition-all"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-black text-black/30 uppercase tracking-widest ml-1">Reps</label>
                                                                <input 
                                                                    type="number" 
                                                                    value={set.reps}
                                                                    onChange={(e) => updateSessionSet(ex.id, setIndex, { reps: parseInt(e.target.value) || 0 })}
                                                                    className="w-full bg-white border border-black/5 rounded-xl px-3 py-2 text-[12px] font-black focus:ring-2 ring-black/5 outline-none transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                            set.weight > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-black/5 text-black/20"
                                                        )}>
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button 
                                                    onClick={() => {
                                                        // Toggle completion logic would go here
                                                        setExpandedExerciseId(routine.exercises[exIndex + 1]?.id || null)
                                                    }}
                                                    className="flex-1 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
                                                >
                                                    Next Exercise
                                                </button>
                                                <button 
                                                    className="px-5 py-3 bg-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black/10 transition-colors"
                                                >
                                                    Skip
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
