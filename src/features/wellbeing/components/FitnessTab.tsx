'use client'

import React, { useState } from 'react'
import { useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { RoutineBuilder } from './RoutineBuilder'
import { GymConnectionModal } from './GymConnectionModal'
import { Dumbbell, Activity, CheckCircle2, Info, Plus, Calendar, Trophy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function FitnessTab() {
    const { routines, activeRoutineId, gymStats, syncGymData } = useWellbeing()
    const [isGymModalOpen, setIsGymModalOpen] = useState(false)

    const activeRoutine = routines.find((r: any) => r.id === activeRoutineId) || routines[0]

    return (
        <div className="space-y-10">
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
                                        <div key={ex.id} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                            <p className="text-[11px] font-bold uppercase truncate">{ex.name}</p>
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{ex.suggestedSets}x{ex.suggestedReps}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 pt-4">
                                    <button className="px-8 py-4 bg-white text-black rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                                        Start Session
                                    </button>
                                    <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                                        View Library
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Weekly Schedule Preview */}
                    <div className="bg-white border border-black/5 rounded-[32px] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black text-black/30 uppercase tracking-[0.3em]">Weekly Split</h3>
                            <button className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
                                Full Schedule <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
                                <div key={day} className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                                    i === 0 ? "bg-black text-white border-black" : "bg-black/[0.02] border-black/5"
                                )}>
                                    <span className="text-[9px] font-black uppercase">{day}</span>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        i < 3 ? "bg-rose-500" : "bg-black/10"
                                    )} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Gym Integration Card */}
                    <div className="bg-white border border-black/5 rounded-[32px] p-8 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-[12px] font-black text-black uppercase tracking-widest">The Gym Group</h3>
                            </div>
                            {gymStats.busyness && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                                        {gymStats.busyness.currentPercentage}% Full
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className={cn(
                            "rounded-2xl p-4 border flex items-center justify-between",
                            gymStats.isIntegrated ? "bg-emerald-50 border-emerald-500/10" : "bg-black/[0.02] border-black/5"
                        )}>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider">Status</p>
                                <p className={cn(
                                    "text-[12px] font-black uppercase",
                                    gymStats.isIntegrated ? "text-emerald-600" : "text-black/60"
                                )}>{gymStats.isIntegrated ? 'Connected' : 'Not Linked'}</p>
                            </div>
                            <button
                                onClick={() => setIsGymModalOpen(true)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                    gymStats.isIntegrated ? "bg-black/5 text-black hover:bg-black/10" : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                )}
                            >
                                {gymStats.isIntegrated ? 'Sync' : 'Connect'}
                            </button>
                        </div>

                        {gymStats.isIntegrated ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-black/[0.02] p-4 rounded-2xl border border-black/5">
                                        <p className="text-[9px] font-black text-black/30 uppercase tracking-wider mb-1 text-center font-mono">visits</p>
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl font-black">{gymStats.weeklyVisits}</span>
                                            <span className="text-[9px] font-bold text-black/40 uppercase">This Week</span>
                                        </div>
                                    </div>
                                    <div className="bg-black/[0.02] p-4 rounded-2xl border border-black/5">
                                        <p className="text-[9px] font-black text-black/30 uppercase tracking-wider mb-1 text-center font-mono">Streak</p>
                                        <div className="flex flex-col items-center">
                                            <span className="text-2xl font-black text-rose-500">12</span>
                                            <span className="text-[9px] font-bold text-black/40 uppercase">Days</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-black/30 uppercase tracking-wider px-1">Log</p>
                                    <div className="space-y-2">
                                        {(gymStats.visitHistory || []).slice(0, 3).map((visit: any) => (
                                            <div key={visit.id} className="bg-black/[0.02] p-3 rounded-xl border border-black/5 flex items-center justify-between group cursor-pointer hover:bg-black/[0.04]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase">{visit.locationName}</p>
                                                        <p className="text-[8px] font-bold text-black/40 uppercase">{visit.date} • {visit.time}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-black/10 group-hover:text-black/40 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                <Info className="w-5 h-5 text-black/10 mx-auto" />
                                <p className="text-[9px] font-black text-black/20 uppercase tracking-widest text-center">Sync to see gym activity</p>
                            </div>
                        )}
                    </div>

                    {/* PRs/Trophies Card */}
                    <div className="bg-black rounded-[32px] p-8 text-white space-y-4">
                        <Trophy className="w-8 h-8 text-amber-500" />
                        <h3 className="text-xl font-black uppercase tracking-tighter leading-tight">Personal Records</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-[10px] font-bold uppercase text-white/40">Deadlift</span>
                                <span className="text-[12px] font-black uppercase tracking-widest text-emerald-400">180kg</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-[10px] font-bold uppercase text-white/40">Squat</span>
                                <span className="text-[12px] font-black uppercase tracking-widest text-emerald-400">140kg</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <GymConnectionModal
                isOpen={isGymModalOpen}
                onClose={() => setIsGymModalOpen(false)}
            />
        </div>
    )
}
