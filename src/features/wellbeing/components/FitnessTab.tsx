'use client'

import React, { useState } from 'react'
import { useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { RoutineBuilder } from './RoutineBuilder'
import { GymConnectionModal } from './GymConnectionModal'
import { MilestoneTracker } from './MilestoneTracker'
import { Dumbbell, Activity, CheckCircle2, Info, Plus, Calendar, Trophy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function FitnessTab() {
    const { routines, activeRoutineId, gymStats, syncGymData, gymRecommendation, logWorkout, workoutLogs } = useWellbeing()
    const [isGymModalOpen, setIsGymModalOpen] = useState(false)
    const [isLogging, setIsLogging] = useState(false)

    const activeRoutine = routines.find((r: any) => r.id === activeRoutineId) || routines[0]

    return (
        <div className="space-y-10">
            {/* Recommendation Banner */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "p-6 rounded-[32px] border flex items-center justify-between",
                    gymRecommendation.status === 'can_go' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        gymRecommendation.status === 'can_go' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    )}>
                        {gymRecommendation.status === 'can_go' ? <Dumbbell className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className="text-[12px] font-black uppercase tracking-widest leading-none mb-1">
                            {gymRecommendation.status === 'can_go' ? 'Recommended: Hit the Gym' : 'Recommended: Rest Day'}
                        </h4>
                        <p className="text-[11px] font-bold text-black/40 uppercase">{gymRecommendation.reason}</p>
                    </div>
                </div>
                {gymRecommendation.status === 'can_go' && (
                    <div className="hidden md:block">
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                            Rotational Split Active
                         </span>
                    </div>
                )}
            </motion.div>
            {/* Active Protocol & Gym Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {routines.length === 0 ? (
                        <RoutineBuilder />
                    ) : (
                        <section className="bg-black text-white rounded-[40px] p-8 relative overflow-hidden min-h-[350px] flex flex-col justify-end group shadow-2xl">
                            <div className="absolute top-0 right-0 p-8">
                                <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                                    <Dumbbell className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div className="space-y-4 relative z-10 w-full">
                                <h3 className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em]">Active Protocol</h3>
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">{activeRoutine?.name}</h2>
                                    <p className="text-rose-500 text-[11px] font-black uppercase tracking-widest">{activeRoutine?.day || 'No Day Assigned'}</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                                    {activeRoutine?.exercises.map((ex: any) => (
                                        <div key={ex.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
                                            <div>
                                                <p className="text-[11px] font-bold uppercase truncate">{ex.name}</p>
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{ex.suggestedSets}x{ex.suggestedReps}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {(ex.muscleGroups || [ex.muscleGroup]).map((mg: string) => (
                                                    <span key={mg} className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                                        {mg}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 pt-4">
                                    <button 
                                        onClick={async () => {
                                            setIsLogging(true)
                                            const log = {
                                                id: Math.random().toString(36).substring(2, 9),
                                                date: new Date().toISOString().split('T')[0],
                                                routineId: activeRoutine.id,
                                                exercises: activeRoutine.exercises.map((ex: any) => ({
                                                    exerciseId: ex.id,
                                                    sets: Array(ex.suggestedSets).fill({ weight: 0, reps: ex.suggestedReps })
                                                }))
                                            }
                                            await logWorkout(log)
                                            setIsLogging(false)
                                            alert('Suggested Session Logged!')
                                        }}
                                        disabled={isLogging}
                                        className="px-8 py-4 bg-white text-black rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
                                    >
                                        {isLogging ? 'Logging...' : 'Quick Log Session'}
                                    </button>
                                    <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                                        Edit Details
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Weekly Schedule Preview */}
                    <div className="bg-white border border-black/5 rounded-[32px] p-8 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-[11px] font-black text-black/30 uppercase tracking-[0.3em]">Operational Flow</h3>
                                <h2 className="text-xl font-black uppercase tracking-tighter">Weekly Split & Logs</h2>
                            </div>
                            <button className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1 group">
                                Full History <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-3">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const d = new Date()
                                d.setDate(d.getDate() - (6 - i))
                                const dateStr = d.toISOString().split('T')[0]
                                const isToday = i === 6
                                const hasVisit = gymStats.visitHistory?.some((v: any) => v.date === dateStr)
                                const hasLog = workoutLogs?.some((l: any) => l.date === dateStr)
                                const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()

                                return (
                                    <div key={dateStr} className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-3xl border transition-all",
                                        isToday ? "bg-black text-white border-black ring-4 ring-black/5" : "bg-black/[0.02] border-black/5"
                                    )}>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{dayName}</span>
                                        <div className="flex flex-col gap-1.5 items-center">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                hasVisit ? "bg-emerald-500 shadow-sm shadow-emerald-500/20" : "bg-black/10"
                                            )} />
                                            {hasLog && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Workout Logged" />
                                            )}
                                        </div>
                                        {isToday && <span className="text-[7px] font-black uppercase text-white/40">Today</span>}
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex items-center gap-10 pt-2 border-t border-black/5">
                             <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Gym Session (API)</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Routine Logic</span>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">


                    <MilestoneTracker />
                </div>
            </div>

            <GymConnectionModal
                isOpen={isGymModalOpen}
                onClose={() => setIsGymModalOpen(false)}
            />
        </div>
    )
}
