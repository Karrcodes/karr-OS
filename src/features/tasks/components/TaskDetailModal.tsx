'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Briefcase, User, CheckSquare, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task } from '../types/tasks.types'

interface TaskDetailModalProps {
    task: Task | null
    isOpen: boolean
    onClose: () => void
    onToggleSubtask: (taskId: string, index: number) => Promise<void>
    onToggleComplete: (taskId: string, completed: boolean) => Promise<void>
}

const PRIORITY_CONFIG = {
    super: { label: 'Super', color: 'bg-blue-50 text-blue-600 border-blue-200 shadow-blue-100/50' },
    high: { label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-200 shadow-orange-100/50' },
    mid: { label: 'Mid', color: 'bg-yellow-50 text-yellow-600 border-yellow-200 shadow-yellow-100/50' },
    low: { label: 'Low', color: 'bg-black/5 text-black/60 border-black/10' }
}

export function TaskDetailModal({ task, isOpen, onClose, onToggleSubtask, onToggleComplete }: TaskDetailModalProps) {
    if (!task) return null

    const checklistItems = task.notes?.type === 'checklist' ? (task.notes.content as any[]) : []
    const completedSubtasks = checklistItems.filter(i => i.completed).length
    const totalSubtasks = checklistItems.length
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white border border-black/[0.08] rounded-3xl shadow-2xl z-[101] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative p-8 pb-6">
                            <button
                                onClick={onClose}
                                className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-black/40 hover:bg-black/10 hover:text-black transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm",
                                    PRIORITY_CONFIG[task.priority || 'low'].color
                                )}>
                                    {task.priority || 'low'}
                                </span>
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-black/40 bg-black/5 uppercase tracking-wider">
                                    {task.profile === 'business' ? <Briefcase className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                    {task.profile}
                                </span>
                            </div>

                            <h2 className={cn(
                                "text-2xl font-bold tracking-tight mb-2",
                                task.is_completed ? "text-black/30 line-through" : "text-black"
                            )}>
                                {task.title}
                            </h2>

                            {task.due_date && (
                                <div className="flex items-center gap-2 text-[12px] font-bold text-black/40 uppercase tracking-widest mt-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {task.due_date_mode === 'before' && "On or Before "}
                                        {task.due_date_mode === 'range' && "From "}
                                        {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        {task.due_date_mode === 'range' && task.end_date && ` → ${new Date(task.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="px-8 pb-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Checklist Section */}
                            {task.notes?.type === 'checklist' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[11px] font-bold text-black/30 uppercase tracking-[0.2em]">Checklist Progress</h3>
                                        <span className="text-[11px] font-bold text-black/60">{completedSubtasks}/{totalSubtasks}</span>
                                    </div>

                                    <div className="h-2 bg-black/[0.03] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-500"
                                        />
                                    </div>

                                    <div className="grid gap-2 mt-6">
                                        {checklistItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => onToggleSubtask(task.id, idx)}
                                                className={cn(
                                                    "group flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer",
                                                    item.completed
                                                        ? "bg-black/[0.01] border-transparent"
                                                        : "bg-white border-black/[0.04] hover:border-black/[0.1] hover:shadow-sm"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                                                    item.completed
                                                        ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20"
                                                        : "bg-white border-black/10 group-hover:border-black/30"
                                                )}>
                                                    {item.completed && <CheckSquare className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className={cn(
                                                    "text-[14px] transition-all",
                                                    item.completed ? "text-black/30 line-through" : "text-black/70 font-medium"
                                                )}>
                                                    {item.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Plain Text Notes Section */}
                            {task.notes?.type !== 'checklist' && task.notes?.content && (
                                <div className="space-y-3">
                                    <h3 className="text-[11px] font-bold text-black/30 uppercase tracking-[0.2em]">Notes</h3>
                                    <div className="p-6 bg-black/[0.02] border border-black/[0.04] rounded-2xl text-[14px] text-black/70 leading-relaxed whitespace-pre-wrap font-medium">
                                        {task.notes.content}
                                    </div>
                                </div>
                            )}

                            {!task.notes?.content && (
                                <div className="flex flex-col items-center justify-center py-12 text-black/20 italic">
                                    <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-[13px]">No additional notes for this task.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="px-8 py-6 bg-black/[0.01] border-t border-black/[0.04] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={task.is_completed}
                                        onChange={(e) => onToggleComplete(task.id, e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-2 border-black/10 checked:bg-black checked:border-black transition-all accent-black"
                                    />
                                    <span className="text-[12px] font-bold text-black/40 group-hover:text-black transition-colors">
                                        {task.is_completed ? 'Task Completed' : 'Mark as Complete'}
                                    </span>
                                </label>
                            </div>

                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-black text-white text-[12px] font-bold rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-black/10 active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
