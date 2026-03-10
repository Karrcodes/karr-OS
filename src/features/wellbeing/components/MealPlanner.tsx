'use client'

import * as React from 'react'
import { useState } from 'react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { RecipeFinder } from './RecipeFinder'
import { Plus, Utensils, X, Clock, Flame, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { MealLog, MacroTargets } from '../types'

export function MealPlanner() {
    const { mealLogs, macros, dailyNutrition, logMeal } = useWellbeing()
    const [showRecipeFinder, setShowRecipeFinder] = useState(false)
    const [showQuickAdd, setShowQuickAdd] = useState(false)

    // Quick Add Form State
    const [manualMeal, setManualMeal] = useState({
        name: '',
        type: 'snack' as const,
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
    })

    const today = new Date().toISOString().split('T')[0]
    const todayMeals = mealLogs.filter((m: MealLog) => m.date === today)

    const handleQuickAdd = (e: React.FormEvent) => {
        e.preventDefault()
        logMeal({
            ...manualMeal,
            date: today,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
        setShowQuickAdd(false)
        setManualMeal({ name: '', type: 'snack', calories: 0, protein: 0, fat: 0, carbs: 0 })
    }

    const macroProgress = (current: number, target: number) => {
        if (target === 0) return 0
        return Math.min(Math.round((current / target) * 100), 100)
    }

    return (
        <div className="space-y-8">
            {/* Macro Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Calories', current: dailyNutrition.calories, target: macros.calories, color: 'bg-black', text: 'text-black' },
                    { label: 'Protein', current: dailyNutrition.protein, target: macros.protein, color: 'bg-rose-500', text: 'text-rose-500' },
                    { label: 'Fats', current: dailyNutrition.fat, target: macros.fat, color: 'bg-amber-500', text: 'text-amber-500' },
                    { label: 'Carbs', current: dailyNutrition.carbs, target: macros.carbs, color: 'bg-emerald-500', text: 'text-emerald-500' },
                ].map((m) => (
                    <div key={m.label} className="bg-white border border-black/5 rounded-[32px] p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[11px] font-black text-black/40 uppercase tracking-widest">{m.label}</p>
                            <p className={cn("text-xs font-black uppercase tracking-widest", m.text)}>
                                {macroProgress(m.current, m.target)}%
                            </p>
                        </div>
                        <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-2xl font-bold">{Math.round(m.current)}</span>
                            <span className="text-sm font-bold text-black/20">/ {m.target}{m.label === 'Calories' ? '' : 'g'}</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${macroProgress(m.current, m.target)}%` }}
                                className={cn("h-full rounded-full transition-all duration-1000", m.color)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Daily Log */}
            <div className="bg-white border border-black/5 rounded-[40px] p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">Today's Meals</h3>
                        <p className="text-black/40 text-sm font-medium">Logged {todayMeals.length} items</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowQuickAdd(true)}
                            className="px-6 py-3 bg-white border border-black/5 rounded-2xl text-xs font-black uppercase tracking-widest hover:border-black/20 transition-all flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> Quick Log
                        </button>
                        <button
                            onClick={() => setShowRecipeFinder(true)}
                            className="px-6 py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Utensils className="h-4 w-4" /> Find Recipe
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {todayMeals.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-black/5 rounded-[32px]">
                            <p className="text-black/30 font-bold uppercase text-xs tracking-widest mb-2">No meals logged yet</p>
                            <p className="text-black/20 text-sm">Start your day by logging breakfast</p>
                        </div>
                    ) : (
                        todayMeals.map((meal) => (
                            <div key={meal.id} className="flex items-center justify-between p-6 bg-black/[0.02] border border-black/5 rounded-[24px] hover:bg-black/[0.04] transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                                        <Clock className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-black/5 rounded-full text-[9px] font-black uppercase tracking-widest text-black/40">
                                                {meal.type} • {meal.time}
                                            </span>
                                        </div>
                                        <h4 className="font-bold tracking-tight">{meal.name}</h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Protein</p>
                                        <p className="font-bold">{meal.protein}g</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-tight">Calories</p>
                                        <p className="text-lg font-bold">{meal.calories}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-black/20 group-hover:text-black/40 transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showRecipeFinder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12"
                    >
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" onClick={() => setShowRecipeFinder(false)} />
                        <motion.div
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 50, scale: 0.95 }}
                            className="relative w-full max-w-4xl bg-[#FAFAFA] border border-black/5 rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-full"
                        >
                            <div className="p-8 border-b border-black/5 flex justify-between items-center">
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight">Recipe Finder</h3>
                                    <p className="text-black/40 font-bold uppercase text-[11px] tracking-widest">Curated for your goals</p>
                                </div>
                                <button onClick={() => setShowRecipeFinder(false)} className="p-4 bg-black/5 hover:bg-black/10 rounded-full transition-all">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto">
                                <RecipeFinder />
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {showQuickAdd && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" onClick={() => setShowQuickAdd(false)} />
                        <motion.div
                            initial={{ y: 20, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 20, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-white border border-black/5 rounded-[40px] shadow-2xl p-8"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight">Quick Log</h3>
                                    <p className="text-black/40 text-sm">Manually enter a meal</p>
                                </div>
                                <button onClick={() => setShowQuickAdd(false)} className="p-2 hover:bg-black/5 rounded-full transition-all">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleQuickAdd} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase tracking-widest text-black/40 ml-1">Meal Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-black/5 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-black/5 transition-all"
                                        placeholder="e.g. Scrambled Eggs"
                                        value={manualMeal.name}
                                        onChange={e => setManualMeal({ ...manualMeal, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-black/40 ml-1 text-rose-500">Calories</label>
                                        <input
                                            type="number"
                                            className="w-full bg-black/5 border-none rounded-2xl p-4 text-sm"
                                            value={manualMeal.calories}
                                            onChange={e => setManualMeal({ ...manualMeal, calories: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-black/40 ml-1 text-emerald-500">Protein (g)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-black/5 border-none rounded-2xl p-4 text-sm"
                                            value={manualMeal.protein}
                                            onChange={e => setManualMeal({ ...manualMeal, protein: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                                >
                                    Log Meal
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
