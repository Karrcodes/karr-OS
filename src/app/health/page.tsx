'use client'

import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { ProfileSetup } from '@/features/wellbeing/components/ProfileSetup'
import { RoutineBuilder } from '@/features/wellbeing/components/RoutineBuilder'
import { MealPlanner } from '@/features/wellbeing/components/MealPlanner'
import { MoodTracker } from '@/features/wellbeing/components/MoodTracker'
import { DailyReflection } from '@/features/wellbeing/components/DailyReflection'
import { GymConnectionModal } from '@/features/wellbeing/components/GymConnectionModal'
import { Activity, Flame, Target, Utensils, Scale, ArrowUpRight, Plus, Info, Heart, Dumbbell, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { KarrFooter } from '@/components/KarrFooter'

export default function HealthPage() {
    const { profile, macros, weightHistory, routines, activeRoutineId, gymStats, dailyNutrition, syncGymData } = useWellbeing()
    const [isGymModalOpen, setIsGymModalOpen] = useState(false)

    useEffect(() => {
        if (gymStats.isIntegrated) {
            syncGymData()
        }
    }, [gymStats.isIntegrated])

    if (!profile) {
        return <ProfileSetup />
    }

    const activeRoutine = routines.find((r: any) => r.id === activeRoutineId) || routines[0]

    const latestWeight = weightHistory.length > 0
        ? weightHistory[weightHistory.length - 1].weight
        : profile.weight

    const stats = [
        { label: 'REMAINING', value: Math.max(0, Math.round(macros.calories - dailyNutrition.calories)), unit: 'kcal', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'PROTEIN', value: Math.max(0, Math.round(macros.protein - dailyNutrition.protein)), unit: 'g', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'CARBS', value: Math.max(0, Math.round(macros.carbs - dailyNutrition.carbs)), unit: 'g', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'FAT', value: Math.max(0, Math.round(macros.fat - dailyNutrition.fat)), unit: 'g', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
    ]

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
            <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto w-full flex-grow">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-[11px] font-black text-rose-500 uppercase tracking-[0.3em]">Wellbeing Protocol</h2>
                        <h1 className="text-4xl font-black text-black tracking-tighter uppercase grayscale">Health Dashboard</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-black/[0.03] border border-black/5 rounded-2xl px-5 py-3 flex items-center gap-4">
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider">Current Phase</p>
                                <p className="text-[13px] font-black text-black uppercase">{profile.goal}</p>
                            </div>
                            <div className="w-px h-8 bg-black/10" />
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider">Weight</p>
                                <p className="text-[13px] font-black text-black uppercase">{latestWeight}kg</p>
                            </div>
                        </div>
                        <button className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center hover:scale-105 transition-transform">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Macro Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowUpRight className="w-3 h-3" />
                                    TARGET
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">{stat.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-black">{stat.value}</span>
                                    <span className="text-[13px] font-bold text-black/40 uppercase">{stat.unit}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                    {/* Left Column: Schedule & Workouts */}
                    <div className="lg:col-span-2 space-y-8">
                        {routines.length === 0 ? (
                            <RoutineBuilder />
                        ) : (
                            <section className="bg-black text-white rounded-[40px] p-8 relative overflow-hidden min-h-[300px] flex flex-col justify-end group">
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
                                        {activeRoutine?.exercises.slice(0, 3).map((ex: any) => (
                                            <div key={ex.id} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                                <p className="text-[11px] font-bold uppercase truncate">{ex.name}</p>
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{ex.suggestedSets}x{ex.suggestedReps}</p>
                                            </div>
                                        ))}
                                        {(activeRoutine?.exercises.length || 0) > 3 && (
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-center">
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">+{activeRoutine!.exercises.length - 3} More</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 pt-4">
                                        <button className="px-8 py-4 bg-white text-black rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                                            Start Session
                                        </button>
                                        <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                                            Edit Split
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        <MealPlanner />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <MoodTracker />
                            <DailyReflection />
                        </div>
                    </div>

                    {/* Right Column: Integration & Insights */}
                    <div className="space-y-6">
                        <div className="bg-white border border-black/5 rounded-[32px] p-6 space-y-6 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-[12px] font-black text-black uppercase tracking-widest">The Gym Group</h3>
                                </div>
                                {gymStats.busyness ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                                            {gymStats.busyness.currentPercentage}% Full
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.03] rounded-xl border border-black/5">
                                        <span className="text-[9px] font-black text-black/30 uppercase tracking-tight">Live Stats Unavailable</span>
                                    </div>
                                )}
                            </div>

                            <div className={cn(
                                "rounded-2xl p-4 border flex items-center justify-between",
                                gymStats.isIntegrated ? "bg-emerald-50 border-emerald-500/10" : "bg-black/[0.02] border-black/5"
                            )}>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-black/30 uppercase tracking-wider">Sync Status</p>
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
                                    {gymStats.isIntegrated ? 'Sync Settings' : 'Connect'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {gymStats.isIntegrated ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-black/[0.02] p-3 rounded-xl border border-black/5">
                                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider mb-1">Weekly Target</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black">{gymStats.weeklyVisits}</span>
                                                    <span className="text-[10px] font-bold text-black/40">/ 4</span>
                                                </div>
                                            </div>
                                            <div className="bg-black/[0.02] p-3 rounded-xl border border-black/5">
                                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider mb-1">Total Visits</p>
                                                <span className="text-xl font-black">{gymStats.totalVisits}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-black/30 uppercase tracking-wider px-1">Recent Activity</p>
                                            <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                                {(gymStats.visitHistory || []).slice(0, 3).map((visit: any) => (
                                                    <div key={visit.id} className="bg-black/[0.02] p-3 rounded-xl border border-black/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] font-black uppercase">{visit.locationName}</p>
                                                                <p className="text-[9px] font-bold text-black/40 uppercase">{visit.date} • {visit.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-bold text-black/40 leading-relaxed uppercase tracking-tight">Sync your Cardiff gym activity to track visits and intensity automatically.</p>
                                        <div className="h-[120px] bg-black/[0.02] border border-dashed border-black/10 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                                            <Info className="w-5 h-5 text-black/10 mb-2" />
                                            <p className="text-[9px] font-black text-black/20 uppercase tracking-widest">No Recent Activity Found</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-black rounded-[32px] p-8 space-y-6 text-white overflow-hidden relative group cursor-pointer">
                            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
                            <Scale className="w-8 h-8 text-rose-500" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tighter">Weight Trends</h3>
                                <p className="text-white/40 text-[12px] font-medium leading-relaxed">Tracking since protocol start. You are currently hit your targets.</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-3xl font-black">78.2</span>
                                <div className="text-emerald-500 flex items-center gap-1 font-black text-[12px]">
                                    <ArrowUpRight className="w-4 h-4" />
                                    +0.4kg
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <GymConnectionModal
                isOpen={isGymModalOpen}
                onClose={() => setIsGymModalOpen(false)}
            />
            <KarrFooter />
        </div>
    )
}
