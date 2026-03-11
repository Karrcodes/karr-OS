'use client'

import React, { useMemo, useState } from 'react'
import { useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { MealPlanner } from './MealPlanner'
import { NutritionHeatmap } from './NutritionHeatmap'
import { Flame, Activity, Utensils, Target, Database, Calendar, ChefHat, ActivitySquare, ChevronRight } from 'lucide-react'
import { NutritionFridgeModal } from './NutritionFridgeModal'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useRota } from '@/features/finance/hooks/useRota'
import { getNextOffPeriod } from '@/features/finance/utils/rotaUtils'

export function NutritionTab() {
    const { macros, dailyNutrition, fridge, library } = useWellbeing()
    const { } = useRota()

    const [isFridgeModalOpen, setIsFridgeModalOpen] = useState(false)

    const nextPrepDay = useMemo(() => {
        // Prep day is the LAST day of the off period (the day before going back to work)
        const nextOff = getNextOffPeriod(new Date())
        return nextOff.end
    }, [])

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

                <div className="space-y-6">
                    {/* Nutrition Trends */}
                    <div className="bg-white border border-black/5 rounded-[32px] p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black text-black/30 uppercase tracking-[0.3em]">Monthly Adherence</h3>
                            <ActivitySquare className="w-4 h-4 text-black/20" />
                        </div>
                        <NutritionHeatmap />
                    </div>

                    {/* Next Prep Day Widget */}
                    <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-[32px] p-8">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <ChefHat className="w-5 h-5 text-indigo-500/30" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-indigo-600/70 uppercase tracking-widest">Next Prep Day</p>
                            <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">
                                {format(nextPrepDay, 'EEEE')}
                            </h3>
                            <p className="text-[12px] font-bold text-indigo-900/40">
                                {format(nextPrepDay, 'do MMMM yyyy')}
                            </p>
                        </div>
                    </div>

                    {/* The Fridge (Inventory) */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsFridgeModalOpen(true)}
                        className="bg-white border border-black/5 rounded-[32px] p-8 space-y-6 cursor-pointer group hover:border-black/10 transition-all hover:shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black text-black/30 uppercase tracking-[0.3em]">The Fridge</h3>
                            <Database className="w-4 h-4 text-black/20 group-hover:text-black/40 transition-colors" />
                        </div>

                        {fridge.length === 0 ? (
                            <div className="text-center py-4 space-y-2">
                                <ChefHat className="w-8 h-8 text-black/10 mx-auto" />
                                <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">Fridge Empty</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div className="flex -space-x-3 overflow-hidden p-1">
                                    {fridge.slice(0, 5).map((item, i) => {
                                        const meal = library.find(m => m.id === item.mealId)
                                        return (
                                            <div
                                                key={item.id}
                                                className="w-12 h-12 rounded-2xl bg-black/[0.02] border border-white flex items-center justify-center text-2xl shadow-sm ring-1 ring-black/5"
                                                style={{ zIndex: 10 - i }}
                                            >
                                                {meal?.emoji || '🍽️'}
                                            </div>
                                        )
                                    })}
                                    {fridge.length > 5 && (
                                        <div className="w-12 h-12 rounded-2xl bg-black/5 border border-white flex items-center justify-center text-[11px] font-black text-black/40 shadow-sm ring-1 ring-black/5">
                                            +{fridge.length - 5}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="text-2xl font-black text-black leading-none">
                                        {fridge.reduce((acc, item) => acc + item.portions, 0)}
                                    </div>
                                    <div className="text-[9px] font-black text-black/20 uppercase tracking-widest mt-1">
                                        Portions
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-black/5 flex items-center justify-between text-[10px] font-black text-black/40 uppercase tracking-widest group-hover:text-black transition-colors">
                            <span>Open Inventory</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </motion.div>

                    <NutritionFridgeModal
                        isOpen={isFridgeModalOpen}
                        onClose={() => setIsFridgeModalOpen(false)}
                    />
                </div>
            </div>
        </div>
    )
}
