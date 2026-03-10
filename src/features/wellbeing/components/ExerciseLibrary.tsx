'use client'

import React, { useState } from 'react'
import { EXERCISES } from '../constants/exercises'
import type { Exercise } from '../types'
import { Search, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExerciseLibraryProps {
    onSelect: (exercise: Exercise) => void
    selectedIds?: string[]
}

export function ExerciseLibrary({ onSelect, selectedIds = [] }: ExerciseLibraryProps) {
    const [search, setSearch] = useState('')

    const filtered = EXERCISES.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.muscleGroup.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                <input
                    type="text"
                    placeholder="Search exercises or muscle groups..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-black/[0.03] border border-black/5 rounded-2xl pl-12 pr-6 py-4 text-[13px] font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filtered.map(exercise => {
                    const isSelected = selectedIds.includes(exercise.id)
                    return (
                        <button
                            key={exercise.id}
                            onClick={() => onSelect(exercise)}
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left",
                                isSelected
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-black border-black/5 hover:border-black/10 shadow-sm"
                            )}
                        >
                            <div className="space-y-0.5">
                                <p className="text-[13px] font-black uppercase tracking-tight">{exercise.name}</p>
                                <p className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    isSelected ? "text-white/40" : "text-black/20"
                                )}>{exercise.muscleGroup}</p>
                            </div>
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                isSelected ? "bg-white/10" : "bg-black/5"
                            )}>
                                {isSelected ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-black/40" />}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
