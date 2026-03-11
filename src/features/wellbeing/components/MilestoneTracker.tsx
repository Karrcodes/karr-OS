'use client'

import React, { useState } from 'react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { Trophy, Plus, Target, CheckCircle2, Trash2, Milestone as MilestoneIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function MilestoneTracker() {
    const { milestones, addMilestone, deleteMilestone, updateMilestone } = useWellbeing()
    const [isAdding, setIsAdding] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newTarget, setNewTarget] = useState('')
    const [newUnit, setNewUnit] = useState('kg')

    const handleAdd = async () => {
        if (!newTitle || !newTarget) return
        await addMilestone({
            title: newTitle,
            targetValue: Number(newTarget),
            currentValue: 0,
            unit: newUnit,
            type: 'lift'
        })
        setNewTitle('')
        setNewTarget('')
        setIsAdding(false)
    }

    return (
        <div className="bg-white border border-black/5 rounded-[32px] p-8 space-y-6 shadow-sm">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h3 className="text-[14px] font-black text-black uppercase tracking-widest">Milestones</h3>
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                    <Plus className={cn("w-4 h-4 transition-transform", isAdding && "rotate-45")} />
                </button>
            </header>

            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                type="text" 
                                placeholder="Milestone (e.g. Bench Press)"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                className="col-span-2 bg-black/[0.03] border border-black/5 rounded-xl px-4 py-3 text-[12px] font-bold outline-none"
                            />
                            <input 
                                type="number" 
                                placeholder="Target"
                                value={newTarget}
                                onChange={e => setNewTarget(e.target.value)}
                                className="bg-black/[0.03] border border-black/5 rounded-xl px-4 py-3 text-[12px] font-bold outline-none"
                            />
                            <select 
                                value={newUnit}
                                onChange={e => setNewUnit(e.target.value)}
                                className="bg-black/[0.03] border border-black/5 rounded-xl px-4 py-3 text-[12px] font-bold outline-none"
                            >
                                <option value="kg">kg</option>
                                <option value="reps">reps</option>
                                <option value="lbs">lbs</option>
                                <option value="days">days</option>
                            </select>
                        </div>
                        <button 
                            onClick={handleAdd}
                            className="w-full py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                            Create Milestone
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-3">
                {milestones.length === 0 ? (
                    <div className="py-10 text-center space-y-2 opacity-20">
                        <MilestoneIcon className="w-8 h-8 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Milestones Set</p>
                    </div>
                ) : (
                    milestones.map(m => {
                        const progress = Math.min(100, (m.currentValue / m.targetValue) * 100)
                        return (
                            <div key={m.id} className="p-4 bg-black/[0.02] border border-black/5 rounded-2xl space-y-3 group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            m.completed ? "bg-emerald-500" : "bg-black/10"
                                        )} />
                                        <p className="text-[12px] font-black uppercase tracking-tight">{m.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => deleteMilestone(m.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-black/20 hover:text-rose-500 transition-all"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                        <span className="text-[10px] font-black text-black/40 uppercase">
                                            {m.currentValue} / {m.targetValue}{m.unit}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-1 bg-black/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        className={cn(
                                            "h-full rounded-full",
                                            m.completed ? "bg-emerald-500" : "bg-rose-500"
                                        )}
                                    />
                                </div>
                                {!m.completed && (
                                    <div className="flex items-center gap-2 pt-1">
                                         <input 
                                            type="number"
                                            placeholder="Update current..."
                                            className="w-20 bg-white border border-black/5 rounded-lg px-2 py-1 text-[10px] font-bold outline-none"
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    const val = Number((e.target as HTMLInputElement).value)
                                                    const completed = val >= m.targetValue
                                                    await updateMilestone(m.id, { 
                                                        currentValue: val,
                                                        completed,
                                                        dateCompleted: completed ? new Date().toISOString() : undefined
                                                    })
                                                    ;(e.target as HTMLInputElement).value = ''
                                                }
                                            }}
                                        />
                                        <span className="text-[9px] font-bold text-black/20 uppercase">Press Enter to Update</span>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
