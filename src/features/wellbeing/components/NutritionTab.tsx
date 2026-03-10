'use client'

import React from 'react'
import { useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { MealPlanner } from './MealPlanner'
import { Flame, Activity, Utensils, Target, Droplets, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function NutritionTab() {
    const { macros, dailyNutrition, dailyWater, logWater } = useWellbeing()

    const stats = [
        { label: 'CALORIES', value: Math.max(0, Math.round(macros.calories - dailyNutrition.calories)), unit: 'kcal', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'PROTEIN', value: Math.max(0, Math.round(macros.protein - dailyNutrition.protein)), unit: 'g', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'CARBS', value: Math.max(0, Math.round(macros.carbs - dailyNutrition.carbs)), unit: 'g', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'FAT', value: Math.max(0, Math.round(macros.fat - dailyNutrition.fat)), unit: 'g', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
    ]

    const waterLiters = (dailyWater / 1000).toFixed(1)
    const waterProgress = Math.min(100, (dailyWater / 3500) * 100)

    return (
        <div className="space-y-10">
            {/* Macro Summary */}
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
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">{stat.label} REMAINING</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-black">{stat.value}</span>
                                <span className="text-[13px] font-bold text-black/40 uppercase">{stat.unit}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <MealPlanner />
                </div>

                <div className="space-y-6">
                    {/* Water Intake */}
                    <div className="bg-blue-600 rounded-[32px] p-8 text-white space-y-6 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                        <div className="flex items-center justify-between">
                            <Droplets className="w-8 h-8 text-blue-200" />
                            <button
                                onClick={() => logWater(250)}
                                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shadow-lg active:scale-90"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black uppercase tracking-tighter">Hydration</h3>
                            <p className="text-blue-100/60 text-[12px] font-medium leading-relaxed uppercase tracking-tight">Daily Target: 3.5L</p>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black">{waterLiters}</span>
                            <span className="text-[13px] font-bold text-blue-100/40 uppercase">Liters</span>
                        </div>
                        {/* Simple Progress Bar */}
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-300 transition-all duration-1000"
                                style={{ width: `${waterProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Quick Add Nutrition */}
                    <div className="bg-white border border-black/5 rounded-[32px] p-8 space-y-6">
                        <h3 className="text-[11px] font-black text-black/30 uppercase tracking-[0.3em]">Quick Entry</h3>
                        <div className="space-y-3">
                            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map((meal) => (
                                <button key={meal} className="w-full flex items-center justify-between p-4 bg-black/[0.02] hover:bg-black/[0.04] border border-black/5 rounded-2xl transition-all group">
                                    <span className="text-[12px] font-black uppercase tracking-tight">{meal}</span>
                                    <Plus className="w-4 h-4 text-black/20 group-hover:text-black transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
