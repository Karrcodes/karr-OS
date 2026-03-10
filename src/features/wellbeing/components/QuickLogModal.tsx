'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Scale, Droplets, Utensils, Check } from 'lucide-react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { cn } from '@/lib/utils'

interface QuickLogModalProps {
    isOpen: boolean
    onClose: () => void
}

type LogType = 'meal' | 'gym' | 'weight'

export function QuickLogModal({ isOpen, onClose }: QuickLogModalProps) {
    const { logWeight, logMeal, logWorkout, routines, profile } = useWellbeing()
    const [activeTab, setActiveTab] = useState<LogType>('meal')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    // Form States
    const [weight, setWeight] = useState(profile?.weight?.toString() || '')
    const [selectedRoutineId, setSelectedRoutineId] = useState(routines[0]?.id || '')
    const [mealName, setMealName] = useState('')
    const [mealCals, setMealCals] = useState('')

    const handleSuccess = () => {
        setShowSuccess(true)
        setTimeout(() => {
            setShowSuccess(false)
            onClose()
        }, 1500)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (activeTab === 'weight') {
                await logWeight(parseFloat(weight))
            } else if (activeTab === 'meal') {
                await logMeal({
                    name: mealName,
                    calories: parseInt(mealCals),
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                    type: 'snack',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: new Date().toISOString().split('T')[0]
                })
            } else if (activeTab === 'gym') {
                const routine = routines.find(r => r.id === selectedRoutineId)
                if (routine) {
                    await logWorkout({
                        id: Math.random().toString(36).substring(2, 9),
                        date: new Date().toISOString().split('T')[0],
                        routineId: routine.id,
                        exercises: routine.exercises.map(ex => ({
                            exerciseId: ex.id,
                            sets: Array(ex.suggestedSets).fill({ reps: ex.suggestedReps, weight: 0 })
                        }))
                    })
                }
            }
            handleSuccess()
        } catch (error) {
            console.error('Logging failed:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[40px] w-full max-w-md overflow-hidden relative shadow-2xl"
            >
                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em] mb-1">Quick Action</h3>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Log Protocol</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-8 flex items-center gap-2 mb-8">
                    {(['meal', 'gym', 'weight'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                activeTab === tab
                                    ? "bg-black text-white border-black"
                                    : "bg-black/[0.02] border-black/5 text-black/30 hover:bg-black/[0.04]"
                            )}
                        >
                            {tab === 'gym' ? 'Gym Session' : tab}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'meal' && (
                            <motion.div
                                key="meal"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black/30 uppercase tracking-widest px-1">Meal Name</label>
                                    <input
                                        type="text"
                                        value={mealName}
                                        onChange={(e) => setMealName(e.target.value)}
                                        className="w-full bg-black/[0.02] border border-black/5 rounded-2xl px-6 py-4 text-[13px] font-black uppercase tracking-tight focus:outline-none focus:border-emerald-500/50 transition-colors"
                                        placeholder="E.G. PROTEIN SHAKE"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black/30 uppercase tracking-widest px-1">Calories</label>
                                    <input
                                        type="number"
                                        value={mealCals}
                                        onChange={(e) => setMealCals(e.target.value)}
                                        className="w-full bg-black/[0.02] border border-black/5 rounded-2xl px-6 py-4 text-xl font-black focus:outline-none focus:border-emerald-500/50 transition-colors"
                                        placeholder="0"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'gym' && (
                            <motion.div
                                key="gym"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black/30 uppercase tracking-widest px-1">Select Routine</label>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {routines.map((routine) => (
                                            <button
                                                key={routine.id}
                                                type="button"
                                                onClick={() => setSelectedRoutineId(routine.id)}
                                                className={cn(
                                                    "w-full p-4 rounded-2xl border text-left transition-all",
                                                    selectedRoutineId === routine.id
                                                        ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                                                        : "bg-black/[0.02] border-black/5 text-black/60 hover:bg-black/[0.04]"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[12px] font-black uppercase">{routine.name}</p>
                                                        <p className={cn(
                                                            "text-[10px] font-bold uppercase",
                                                            selectedRoutineId === routine.id ? "text-white/60" : "text-black/30"
                                                        )}>
                                                            {routine.exercises.length} Exercises
                                                        </p>
                                                    </div>
                                                    {selectedRoutineId === routine.id && <Check className="w-4 h-4" />}
                                                </div>
                                            </button>
                                        ))}
                                        {routines.length === 0 && (
                                            <p className="text-[11px] font-medium text-black/40 text-center py-4">
                                                No routines found. Create one in the Fitness tab.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'weight' && (
                            <motion.div
                                key="weight"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black/30 uppercase tracking-widest px-1">Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full bg-black/[0.02] border border-black/5 rounded-2xl px-6 py-4 text-xl font-black focus:outline-none focus:border-rose-500/50 transition-colors"
                                        placeholder="0.0"
                                        autoFocus
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={isSubmitting || showSuccess}
                        className={cn(
                            "w-full py-5 rounded-[24px] text-[12px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                            showSuccess
                                ? "bg-emerald-500 text-white"
                                : "bg-black text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10"
                        )}
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : showSuccess ? (
                            <>
                                <Check className="w-5 h-5" />
                                LOGGED
                            </>
                        ) : (
                            'Confirm Log'
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}
