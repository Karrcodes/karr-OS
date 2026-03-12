'use client'

import React from 'react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { X, Check, Activity, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { WorkoutRoutine } from '../types'

interface RoutineSwitcherModalProps {
    isOpen: boolean
    onClose: () => void
}

export function RoutineSwitcherModal({ isOpen, onClose }: RoutineSwitcherModalProps) {
    const { routines, activeRoutineId, setActiveRoutineId, deleteRoutine } = useWellbeing()
    const [deletingId, setDeletingId] = React.useState<string | null>(null)

    const handleSelect = (id: string) => {
        setActiveRoutineId(id)
        onClose()
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setDeletingId(id)
    }

    const confirmDelete = () => {
        if (deletingId) {
            deleteRoutine(deletingId)
            setDeletingId(null)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[40px] p-10 z-[1000] shadow-2xl border border-black/5 max-h-[80vh] flex flex-col"
                    >
                        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-black/5 rounded-full transition-colors z-10">
                            <X className="w-5 h-5 text-black/20" />
                        </button>

                        <div className="space-y-8 flex-1 flex flex-col min-h-0">
                            <div className="space-y-2">
                                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mb-4">
                                    <Activity className="w-6 h-6 text-black" />
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-1">Routines</div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Switch Protocol</h2>
                                <p className="text-[13px] font-medium text-black/40 leading-relaxed uppercase tracking-tight">
                                    Select which split you want to activate for your dashboard.
                                </p>
                            </div>

                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                                {routines.map((routine: WorkoutRoutine) => {
                                    const isActive = routine.id === activeRoutineId
                                    return (
                                        <button
                                            key={routine.id}
                                            onClick={() => handleSelect(routine.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left group",
                                                isActive 
                                                    ? "bg-black border-black text-white" 
                                                    : "bg-white border-black/5 hover:border-black/10"
                                            )}
                                        >
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <h4 className="text-[15px] font-black uppercase tracking-tight truncate">
                                                    {routine.name}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest",
                                                        isActive ? "text-white/40" : "text-black/20"
                                                    )}>
                                                        {routine.exercises.length} Exercises
                                                    </span>
                                                    {routine.day && (
                                                        <>
                                                            <div className={cn("w-1 h-1 rounded-full", isActive ? "bg-white/20" : "bg-black/10")} />
                                                            <span className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest",
                                                                isActive ? "text-rose-400" : "text-rose-500"
                                                            )}>
                                                                {routine.day}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!isActive && (
                                                    <button 
                                                        onClick={(e) => handleDelete(e, routine.id)}
                                                        className="p-2 text-rose-500/30 hover:text-rose-500 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all",
                                                    isActive ? "bg-white/10" : "bg-black/5"
                                                )}>
                                                    {isActive ? <Check className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-black/20" />}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Confirmation Modal */}
            <AnimatePresence>
                {deletingId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1100] flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl space-y-6"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                                <Trash2 className="w-7 h-7 text-rose-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-tight">Delete Routine?</h3>
                                <p className="text-[13px] font-medium text-black/40 leading-relaxed uppercase tracking-tight">
                                    This action cannot be undone. Are you sure you want to remove this protocol?
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={confirmDelete}
                                    className="w-full py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/20"
                                >
                                    Confirm Delete
                                </button>
                                <button 
                                    onClick={() => setDeletingId(null)}
                                    className="w-full py-4 bg-black/5 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    )
}

import { ChevronRight } from 'lucide-react'
