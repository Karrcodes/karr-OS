'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Database, Utensils, Trash2, ChefHat, Coffee, UtensilsCrossed, Moon, Apple, Zap } from 'lucide-react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { ComboEmojiStack } from './ComboEmojiStack'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import ConfirmationModal from '@/components/ConfirmationModal'

interface NutritionFridgeModalProps {
    isOpen: boolean
    onClose: () => void
}

export function NutritionFridgeModal({ isOpen, onClose }: NutritionFridgeModalProps) {
    const { fridge, library, consumeFromFridge, removeFromFridge, updateFridgePortions } = useWellbeing()
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null)
    const [itemToConsume, setItemToConsume] = useState<{ id: string, name: string, meal: any } | null>(null)
    const [selectedConsumeType, setSelectedConsumeType] = useState<'dewbit' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack')

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
                className="bg-[#fafafa] rounded-[48px] w-full max-w-4xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]"
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
                                        className="bg-white border border-black/5 rounded-[32px] p-8 flex items-center justify-between group hover:border-black/10 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-5">
                                            <ComboEmojiStack
                                                isCombo={meal.isCombo}
                                                contents={meal.contents}
                                                fallbackEmoji={meal.emoji}
                                                size="md"
                                                className="border border-black/5 rounded-2xl"
                                            />
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-black/20 uppercase tracking-tighter">
                                                        Prepped {format(new Date(item.prepDate), 'MMM do')}
                                                    </span>
                                                </div>
                                                <h4 className="font-extrabold text-lg leading-none uppercase tracking-tight text-black">{meal.name}</h4>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-black/20">
                                                    <span className="text-black/60 capitalize">{meal.calories} kcal</span>
                                                    <div className="flex gap-3">
                                                        <span className="text-rose-500/60">{meal.protein}g P</span>
                                                        <span className="text-emerald-500/60">{meal.carbs}g C</span>
                                                        <span className="text-amber-500/60">{meal.fat}g F</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Manual Portion Adjuster */}
                                            <div className="flex flex-col items-center gap-2 bg-black/[0.03] p-1.5 rounded-2xl border border-black/5">
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => updateFridgePortions(item.id, item.portions - 1)}
                                                        className="w-8 h-8 rounded-xl bg-white border border-black/5 flex items-center justify-center text-lg font-black hover:bg-black/5 active:scale-90 transition-all shadow-sm"
                                                    >
                                                        -
                                                    </button>
                                                    <div className="flex flex-col items-center min-w-[32px]">
                                                        <span className="text-xl font-black text-black tabular-nums">{item.portions}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => updateFridgePortions(item.id, item.portions + 1)}
                                                        className="w-8 h-8 rounded-xl bg-white border border-black/5 flex items-center justify-center text-lg font-black hover:bg-black/5 active:scale-90 transition-all shadow-sm"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-[8px] font-black text-black/20 uppercase tracking-[0.2em]">Inventory</span>
                                            </div>

                                            <div className="h-16 w-px bg-black/5" />

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        const currentTypes = Array.isArray(meal.type) ? meal.type : [meal.type || 'snack']
                                                        setSelectedConsumeType(currentTypes[0] as any || 'snack')
                                                        setItemToConsume({ id: item.id, name: meal.name, meal })
                                                    }}
                                                    className="h-14 px-6 rounded-2xl bg-black text-white text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-black/10"
                                                >
                                                    <Utensils className="w-4 h-4" /> Consume
                                                </button>

                                                <button
                                                    onClick={() => setItemToDelete({ id: item.id, name: meal.name })}
                                                    className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"
                                                    title="Throw Away"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </motion.div>

            <ConfirmationModal
                isOpen={!!itemToConsume}
                onClose={() => setItemToConsume(null)}
                onConfirm={async () => {
                    if (itemToConsume) {
                        await consumeFromFridge(itemToConsume.id, selectedConsumeType)
                        setItemToConsume(null)
                    }
                }}
                title="Consume Meal"
                message={`Log "${itemToConsume?.name}" to Today's Meals?`}
                confirmText="Log & Consume"
                type="info"
                maxWidth="max-w-xl"
            >
                <div className="mt-4 pt-6 border-t border-black/5">
                    <div className="grid grid-cols-5 gap-3 mb-8">
                        {(['dewbit', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => {
                            const Icon = 
                                type === 'breakfast' ? Coffee :
                                type === 'lunch' ? UtensilsCrossed :
                                type === 'dinner' ? Moon :
                                type === 'snack' ? Apple : Zap
                            
                            return (
                                <button
                                    key={type}
                                    onClick={() => setSelectedConsumeType(type)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-4 rounded-[24px] gap-3 transition-all",
                                        selectedConsumeType === type 
                                            ? "bg-black text-white shadow-2xl" 
                                            : "bg-black/5 text-black/40 hover:bg-black/10"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4", selectedConsumeType === type ? "text-white" : "text-black/20")} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">{type}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </ConfirmationModal>

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
