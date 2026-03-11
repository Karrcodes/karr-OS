'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Database, Utensils, Trash2, ChefHat } from 'lucide-react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import ConfirmationModal from '@/components/ConfirmationModal'

interface NutritionFridgeModalProps {
    isOpen: boolean
    onClose: () => void
}

export function NutritionFridgeModal({ isOpen, onClose }: NutritionFridgeModalProps) {
    const { fridge, library, consumeFromFridge, removeFromFridge } = useWellbeing()
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null)

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
                className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 pb-6 flex items-center justify-between shrink-0 border-b border-black/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black/[0.03] rounded-2xl flex items-center justify-center">
                            <Database className="w-6 h-6 text-black/60" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">The Fridge</h2>
                            <p className="text-[11px] font-bold text-black/40 uppercase tracking-widest mt-1">
                                {fridge.reduce((acc, item) => acc + item.portions, 0)} Portions Available
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/[0.01]">
                    {fridge.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <div className="w-20 h-20 bg-black/[0.02] rounded-full flex items-center justify-center mx-auto mb-4">
                                <ChefHat className="w-10 h-10 text-black/10" />
                            </div>
                            <h3 className="text-lg font-black text-black/60 uppercase tracking-widest">Fridge is Empty</h3>
                            <p className="text-sm font-bold text-black/30 uppercase tracking-wider max-w-xs mx-auto">
                                Stock up on Prep Day to see your prepped meals here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {fridge.map((item) => {
                                const meal = library.find(m => m.id === item.mealId)
                                if (!meal) return null

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white border border-black/5 rounded-[32px] p-6 flex items-center justify-between group hover:border-black/10 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="text-4xl bg-black/[0.02] w-20 h-20 rounded-3xl flex items-center justify-center border border-black/5">
                                                {meal.emoji || '🍽️'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                                                        meal.type === 'breakfast' ? "bg-amber-50 text-amber-600" :
                                                            meal.type === 'lunch' ? "bg-emerald-50 text-emerald-600" :
                                                                meal.type === 'dinner' ? "bg-blue-50 text-blue-600" :
                                                                    "bg-rose-50 text-rose-600"
                                                    )}>
                                                        {meal.type || 'snack'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-black/30 uppercase">
                                                        Prepped {format(new Date(item.prepDate), 'MMM do')}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-xl leading-none mb-3 uppercase tracking-tight">{meal.name}</h4>
                                                <div className="flex items-center gap-4 text-xs font-bold text-black/40">
                                                    <span className="text-black">{meal.calories} kcal</span>
                                                    <span className="text-rose-500">{meal.protein}g P</span>
                                                    <span className="text-emerald-500">{meal.carbs}g C</span>
                                                    <span className="text-amber-500">{meal.fat}g F</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-center gap-1 mr-2">
                                                <div className="bg-black/5 px-3 py-1.5 rounded-xl text-sm font-black text-black tabular-nums">
                                                    x{item.portions}
                                                </div>
                                                <span className="text-[9px] font-black text-black/20 uppercase tracking-widest">Left</span>
                                            </div>

                                            <button
                                                onClick={() => consumeFromFridge(item.id)}
                                                className="h-14 px-6 rounded-2xl bg-black text-white text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-black/10"
                                            >
                                                <Utensils className="w-4 h-4" /> Consume
                                            </button>

                                            <button
                                                onClick={() => setItemToDelete({ id: item.id, name: meal.name })}
                                                className="h-14 w-14 rounded-2xl bg-black/5 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                title="Throw Away"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </motion.div>

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={async () => {
                    if (itemToDelete) {
                        await removeFromFridge(itemToDelete.id)
                        setItemToDelete(null)
                    }
                }}
                title="Throw Away Meal"
                message={`Are you sure you want to throw away your prepared "${itemToDelete?.name}"? This removes all remaining portions from the fridge.`}
                confirmText="Throw Away"
                type="danger"
            />
        </div>
    )
}
