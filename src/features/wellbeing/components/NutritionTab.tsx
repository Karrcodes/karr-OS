'use client'

import React from 'react'
import { useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { MealPlanner } from './MealPlanner'
import { Flame, Activity, Utensils, Target, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function NutritionTab() {
    const { macros, dailyNutrition } = useWellbeing()

    const stats = [
        { label: 'CALORIES', value: Math.max(0, Math.round(macros.calories - dailyNutrition.calories)), unit: 'kcal', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'PROTEIN', value: Math.max(0, Math.round(macros.protein - dailyNutrition.protein)), unit: 'g', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'CARBS', value: Math.max(0, Math.round(macros.carbs - dailyNutrition.carbs)), unit: 'g', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'FAT', value: Math.max(0, Math.round(macros.fat - dailyNutrition.fat)), unit: 'g', icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
    ]

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
    )
}
