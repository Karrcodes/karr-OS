'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Flame, Database, Plus, Trash2, GripVertical } from 'lucide-react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { cn } from '@/lib/utils'
import type { LibraryMeal } from '../types'
import ConfirmationModal from '@/components/ConfirmationModal'

interface NutritionLibraryModalProps {
    isOpen: boolean
    onClose: () => void
}

export function NutritionLibraryModal({ isOpen, onClose }: NutritionLibraryModalProps) {
    const { library, logMeal, updateLibraryMeal, removeMealFromLibrary, addPrepToFridge } = useWellbeing()
    const [selectedType, setSelectedType] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all')
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverType, setDragOverType] = useState<string | null>(null)
    const [mealToDelete, setMealToDelete] = useState<LibraryMeal | null>(null)
    const [mealToPrep, setMealToPrep] = useState<LibraryMeal | null>(null)

    if (!isOpen) return null

    const filteredLibrary = selectedType === 'all'
        ? library
        : library.filter((m: LibraryMeal) => m.type === selectedType)

    const handleQuickLog = async (meal: LibraryMeal) => {
        await logMeal({
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            fat: meal.fat,
            carbs: meal.carbs,
            type: meal.type || 'snack',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toISOString().split('T')[0]
        })
        onClose()
    }

    const handlePointerDrop = async (mealId: string, x: number, y: number) => {
        const elements = document.elementsFromPoint(x, y)
        let targetType: string | null = null
        for (const el of elements) {
            if (el instanceof HTMLElement && el.dataset.categoryType) {
                targetType = el.dataset.categoryType
                break
            }
        }
        setDraggingId(null)
        setDragOverType(null)
        if (targetType && targetType !== 'all') {
            await updateLibraryMeal(mealId, { type: targetType as any })
        }
    }

    const handlePrepMeal = async (meal: LibraryMeal) => {
        // Defaulting to 4 portions for a typical meal prep batch
        await addPrepToFridge(meal.id, 4)
        // We could add a toast here, but the main UI will update automatically
    }

    const handlePointerDragOver = (x: number, y: number) => {
        const elements = document.elementsFromPoint(x, y)
        for (const el of elements) {
            if (el instanceof HTMLElement && el.dataset.categoryType) {
                setDragOverType(el.dataset.categoryType)
                return
            }
        }
        setDragOverType(null)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ touchAction: draggingId ? 'none' : 'auto' }}>
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
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Nutrition Library</h2>
                            <p className="text-[11px] font-bold text-black/40 uppercase tracking-widest mt-1">
                                {library.length} Saved Meals
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

                {/* Filters / Drop Zones */}
                <div className="px-8 py-4 border-b border-black/5 flex items-center overflow-x-auto no-scrollbar shrink-0">
                    <div className="flex items-center gap-2 bg-black/[0.03] p-1.5 rounded-[24px] w-fit border border-black/5">
                        {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => {
                            const isOver = dragOverType === type && type !== 'all'
                            // Use consistent color coding
                            const typeStyle = type === 'breakfast' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                type === 'lunch' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                    type === 'dinner' ? "bg-blue-50 text-blue-600 border-blue-200" :
                                        type === 'snack' ? "bg-rose-50 text-rose-600 border-rose-200" : ""

                            return (
                                <button
                                    key={type}
                                    data-category-type={type}
                                    onClick={() => setSelectedType(type)}
                                    className={cn(
                                        "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                        selectedType === type
                                            ? "bg-white text-black shadow-sm border border-black/5"
                                            : "text-black/40 hover:text-black hover:bg-white/50 border border-transparent",
                                        isOver && typeStyle,
                                        isOver && "scale-105 shadow-sm border"
                                    )}
                                >
                                    {type}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-black/[0.01]">
                    {filteredLibrary.length === 0 ? (
                        <div className="text-center py-12">
                            <Database className="w-12 h-12 text-black/10 mx-auto mb-4" />
                            <h3 className="text-sm font-black text-black/60 uppercase tracking-widest mb-1">Library Empty</h3>
                            <p className="text-xs font-bold text-black/40 uppercase tracking-wider">No meals found in this category</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filteredLibrary.map((meal: LibraryMeal) => (
                                <LibraryMealCard
                                    key={meal.id}
                                    meal={meal}
                                    isDragging={draggingId === meal.id}
                                    onLog={() => handleQuickLog(meal)}
                                    onPrep={() => setMealToPrep(meal)}
                                    onDelete={() => setMealToDelete(meal)}
                                    onPointerDragStart={() => setDraggingId(meal.id)}
                                    onPointerDragOver={handlePointerDragOver}
                                    onPointerDrop={handlePointerDrop}
                                    onPointerDragEnd={() => { setDraggingId(null); setDragOverType(null) }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            <ConfirmationModal
                isOpen={!!mealToDelete}
                onClose={() => setMealToDelete(null)}
                onConfirm={async () => {
                    if (mealToDelete) {
                        await removeMealFromLibrary(mealToDelete.id)
                        setMealToDelete(null)
                    }
                }}
                title="Remove from Library"
                message={`Are you sure you want to remove "${mealToDelete?.name}" from your saved meals library?`}
                confirmText="Remove"
                type="danger"
            />

            <ConfirmationModal
                isOpen={!!mealToPrep}
                onClose={() => setMealToPrep(null)}
                onConfirm={async () => {
                    if (mealToPrep) {
                        await handlePrepMeal(mealToPrep)
                        setMealToPrep(null)
                    }
                }}
                title="Prep Meal"
                message={`Add 4 portions of "${mealToPrep?.name}" to your Fridge inventory?`}
                confirmText="Prep Meal"
                type="danger" // Currently using danger since it's the primary button style in this modal, could customize later
            />
        </div>
    )
}

function LibraryMealCard({ meal, isDragging, onLog, onPrep, onDelete, onPointerDragStart, onPointerDragOver, onPointerDrop, onPointerDragEnd }: {
    meal: LibraryMeal;
    isDragging: boolean;
    onLog: () => void;
    onPrep: () => void;
    onDelete: () => void;
    onPointerDragStart: () => void;
    onPointerDragOver: (x: number, y: number) => void;
    onPointerDrop: (mealId: string, x: number, y: number) => void;
    onPointerDragEnd: () => void;
}) {
    const isDraggingRef = useRef(false)
    const startPos = useRef({ x: 0, y: 0 })

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only allow dragging from the main card area, not buttons
        if ((e.target as HTMLElement).closest('button')) return

        e.preventDefault()
        startPos.current = { x: e.clientX, y: e.clientY }
        isDraggingRef.current = false

        let ghost: HTMLDivElement | null = null

        const handleMove = (ev: PointerEvent) => {
            const dx = ev.clientX - startPos.current.x
            const dy = ev.clientY - startPos.current.y
            if (!isDraggingRef.current && Math.sqrt(dx * dx + dy * dy) > 8) {
                isDraggingRef.current = true
                onPointerDragStart()

                const typeColor = meal.type === 'breakfast' ? "#d97706" :
                    meal.type === 'lunch' ? "#059669" :
                        meal.type === 'dinner' ? "#2563eb" : "#e11d48"

                ghost = document.createElement('div')
                ghost.style.cssText = [
                    'position:fixed',
                    'pointer-events:none',
                    'z-index:9999',
                    'width:280px',
                    'background:white',
                    'border-radius:24px',
                    'box-shadow:0 24px 48px rgba(0,0,0,0.18),0 0 0 1px rgba(0,0,0,0.06)',
                    'padding:16px',
                    'transform:rotate(-2deg) scale(0.95)',
                    'opacity:0.96',
                ].join(';')
                ghost.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <span style="padding:2px 8px;border-radius:6px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1px;background:rgba(0,0,0,0.05);color:${typeColor};">
                            ${meal.type || 'SNACK'}
                        </span>
                    </div>
                    <div style="font-size:16px;font-weight:700;line-height:1;margin-bottom:8px;color:#000;">${meal.emoji || '🍽️'} ${meal.name}</div>
                    <div style="font-size:12px;font-weight:700;color:rgba(0,0,0,0.4); display:flex; gap: 8px;">
                        <span>${meal.calories} kcal</span>
                    </div>
                `
                document.body.appendChild(ghost)
            }
            if (isDraggingRef.current) {
                onPointerDragOver(ev.clientX, ev.clientY)
                if (ghost) {
                    ghost.style.left = `${ev.clientX - 140}px`
                    ghost.style.top = `${ev.clientY - 40}px`
                }
            }
        }

        const handleUp = (ev: PointerEvent) => {
            window.removeEventListener('pointermove', handleMove)
            window.removeEventListener('pointerup', handleUp)
            if (ghost) { ghost.remove(); ghost = null }
            if (isDraggingRef.current) {
                onPointerDrop(meal.id, ev.clientX, ev.clientY)
                isDraggingRef.current = false
            }
            onPointerDragEnd()
        }

        window.addEventListener('pointermove', handleMove)
        window.addEventListener('pointerup', handleUp)
    }

    return (
        <div
            onPointerDown={handlePointerDown}
            className={cn(
                "bg-white border border-black/5 rounded-[24px] p-5 flex items-center justify-between group hover:border-black/10 transition-colors cursor-grab active:cursor-grabbing",
                isDragging && "opacity-30 scale-95 shadow-none pointer-events-none"
            )}
        >
            <div className="flex items-center gap-4">
                <div className="text-black/20 group-hover:text-black/40 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
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
                        {meal.ingredients?.length > 0 && (
                            <span className="text-[10px] font-bold text-black/30">
                                {meal.ingredients.length} Ingredients
                            </span>
                        )}
                    </div>
                    <h4 className="font-bold text-lg leading-none mb-3">
                        <span className="text-xl mr-2">{meal.emoji || '🍽️'}</span>
                        {meal.name}
                    </h4>
                    <div className="flex items-center gap-4 text-xs font-bold text-black/40">
                        <span className="text-black flex items-center gap-1">
                            <Flame className="w-3 h-3" /> {meal.calories} kcal
                        </span>
                        <span className="text-rose-500">{meal.protein}g P</span>
                        <span className="text-emerald-500">{meal.carbs}g C</span>
                        <span className="text-amber-500">{meal.fat}g F</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onPrep()
                    }}
                    className="h-10 px-4 rounded-xl bg-black/[0.03] text-black border border-black/5 text-[10px] font-black uppercase tracking-widest hover:bg-black/5 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0"
                    title="Prep 4 portions into Fridge"
                >
                    <Database className="w-3.5 h-3.5" /> Prep
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onLog()
                    }}
                    className="h-10 px-4 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" /> Log
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="h-10 w-10 ml-2 rounded-xl bg-black/5 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shrink-0"
                    title="Remove from Library"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
