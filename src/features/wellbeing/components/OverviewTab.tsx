'use client'

import React from 'react'
import { useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { MealPlanner } from './MealPlanner'
import { MoodTracker } from './MoodTracker'
import { DailyReflection } from './DailyReflection'
import { RoutineBuilder } from './RoutineBuilder'
import { Flame, Activity, Utensils, Target, Dumbbell, ArrowUpRight, Scale, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'

import { WeightChart } from './WeightChart'
import { MacroTrendChart } from './MacroTrendChart'
import { WorkoutHeatmap } from './WorkoutHeatmap'

import type { DashboardComponentId } from '../types'

export function OverviewTab() {
    const { profile, macros, weightHistory, routines, activeRoutineId, gymStats, dailyNutrition, dashboardLayout } = useWellbeing()
    const activeRoutine = routines.find((r: any) => r.id === activeRoutineId) || routines[0]

    const latestWeight = weightHistory.length > 0
        ? weightHistory[weightHistory.length - 1].weight
        : profile?.weight || 0

    const stats = [
        { label: 'CALORIES', value: Math.max(0, Math.round(macros.calories - dailyNutrition.calories)), unit: 'kcal', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'PROTEIN', value: Math.max(0, Math.round(macros.protein - dailyNutrition.protein)), unit: 'g', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'CARBS', value: Math.max(0, Math.round(macros.carbs - dailyNutrition.carbs)), unit: 'g', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'FAT', value: Math.max(0, Math.round(macros.fat - dailyNutrition.fat)), unit: 'g', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
    ]

    const renderComponent = (id: DashboardComponentId, column: 'main' | 'sidebar') => {
        switch (id) {
            case 'macros':
                return (
                    <div key={id} className={cn(
                        "grid gap-4",
                        column === 'main' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-2"
                    )}>
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link
                                    href="/health/nutrition"
                                    className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer block"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn("p-3 rounded-2xl", stat.bg)}>
                                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowUpRight className="w-3 h-3" />
                                            DETAILS
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">{stat.label}</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-black">{stat.value}</span>
                                            <span className="text-[13px] font-bold text-black/40 uppercase">{stat.unit}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )
            case 'weight_trends':
                return (
                    <section key={id} className="bg-white border border-black/5 rounded-[40px] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <h3 className="text-[11px] font-black text-black/30 uppercase tracking-[0.3em]">Protocol Progress</h3>
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Weight Trends</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-black/20 uppercase tracking-widest mb-1">Current</p>
                                <p className="text-2xl font-black">{latestWeight}kg</p>
                            </div>
                        </div>
                        <WeightChart />
                    </section>
                )
            case 'active_protocol':
                return (
                    <div key={id}>
                        {routines.length === 0 ? (
                            <RoutineBuilder />
                        ) : (
                            <Link
                                href="/health/fitness"
                                className="bg-black text-white rounded-[40px] p-8 relative overflow-hidden min-h-[300px] flex flex-col justify-end group cursor-pointer block"
                            >
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
                                    <div className="flex items-center gap-4 pt-4">
                                        <button className="px-8 py-4 bg-white text-black rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                                            Start Session
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                )
            case 'meal_planner':
                return <MealPlanner key={id} />
            case 'mood_reflection':
                return (
                    <div key={id} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MoodTracker />
                        <DailyReflection />
                    </div>
                )
            case 'nutritional_trends':
                return (
                    <div key={id} className="bg-white border border-black/5 rounded-[40px] p-8 shadow-sm space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em]">Fuel History</h3>
                            <h2 className="text-xl font-black uppercase tracking-tighter">7-Day Calories</h2>
                        </div>
                        <MacroTrendChart />
                    </div>
                )
            case 'workout_consistency':
                return (
                    <div key={id} className="bg-white border border-black/5 rounded-[40px] p-8 shadow-sm">
                        <WorkoutHeatmap />
                    </div>
                )
            case 'gym_activity':
                return (
                    <Link
                        key={id}
                        href="/health/fitness"
                        className="bg-white border border-black/5 rounded-[32px] p-6 space-y-6 shadow-sm cursor-pointer hover:shadow-md transition-all group block"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-[12px] font-black text-black uppercase tracking-widest">Gym Activity</h3>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-black/10 group-hover:text-black transition-colors" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/[0.02] p-3 rounded-xl border border-black/5">
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider mb-1">Weekly</p>
                                <span className="text-xl font-black">{gymStats.weeklyVisits} / 4</span>
                            </div>
                            <div className="bg-black/[0.02] p-3 rounded-xl border border-black/5">
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-wider mb-1">Total</p>
                                <span className="text-xl font-black">{gymStats.totalVisits}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {(gymStats.visitHistory || []).slice(0, 2).map((visit: any) => (
                                <div key={visit.id} className="bg-black/[0.02] p-3 rounded-xl border border-black/5 flex items-center gap-3">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <p className="text-[10px] font-black uppercase truncate">{visit.locationName}</p>
                                </div>
                            ))}
                        </div>
                    </Link>
                )
            default:
                return null
        }
    }

    return (
        <div className="space-y-10 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {dashboardLayout.main.filter(c => c.isVisible).map(comp => renderComponent(comp.id, 'main'))}
                </div>

                <div className="space-y-6">
                    {dashboardLayout.sidebar.filter(c => c.isVisible).map(comp => renderComponent(comp.id, 'sidebar'))}
                </div>
            </div>
        </div>
    )
}
