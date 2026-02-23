'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
    Plus,
    Search,
    Calendar,
    Clock,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    Trash2,
    Edit2,
    GripVertical,
    Zap,
    Briefcase,
    User,
    CheckSquare,
    AlertCircle,
    ArrowRight,
    Activity,
    ShoppingCart,
    Bell,
    X,
    RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { useTasks } from '../hooks/useTasks'
import { cn } from '@/lib/utils'
import type { Task } from '../types/tasks.types'
import { TaskDetailModal } from './TaskDetailModal'
import { getNextOffPeriod, isShiftDay } from '@/features/finance/utils/rotaUtils'

const PRIORITY_CONFIG = {
    super: { label: 'Super', color: 'bg-blue-50 text-blue-600 border-blue-200', sort: 0 },
    high: { label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-200', sort: 1 },
    mid: { label: 'Mid', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', sort: 2 },
    low: { label: 'Low', color: 'bg-black/5 text-black/60 border-black/10', sort: 3 }
} as const

export function TaskList({ category }: { category: 'todo' | 'grocery' | 'reminder' }) {
    const { tasks, loading, createTask, toggleTask, deleteTask, clearAllTasks, clearCompletedTasks, editTask, updateTaskPositions } = useTasks(category)

    // Internalized title and icon logic
    const title = category === 'todo' ? 'Deployment' : category === 'grocery' ? 'Grocery List' : 'Reminders'
    const Icon = category === 'todo' ? Activity : category === 'grocery' ? ShoppingCart : Bell
    const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null)
    const [newTask, setNewTask] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [amount, setAmount] = useState('1')
    const [priority, setPriority] = useState<'super' | 'high' | 'mid' | 'low'>('low')
    const [dueDate, setDueDate] = useState('')
    const [dueDateMode, setDueDateMode] = useState<'none' | 'on' | 'before' | 'range' | 'recurring'>('none')
    const [endDate, setEndDate] = useState('')
    const [recurringType, setRecurringType] = useState<'daily' | 'work_days' | 'off_days' | 'custom'>('off_days')
    const [recurringTime, setRecurringTime] = useState('')
    const [recurringDuration, setRecurringDuration] = useState('60')
    const [recurringDays, setRecurringDays] = useState<number[]>([])
    const [lastDeletedTask, setLastDeletedTask] = useState<Task | null>(null)
    const [showUndo, setShowUndo] = useState(false)
    const [showCreateNotes, setShowCreateNotes] = useState(false)
    const [createNotesType, setCreateNotesType] = useState<'text' | 'bullets' | 'checklist'>('text')
    const [createNotesContent, setCreateNotesContent] = useState<any>('')
    const [newCreateChecklistItem, setNewCreateChecklistItem] = useState('')

    // Confirmation Modal States
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        action: () => Promise<void>;
        confirmText: string;
        type: 'danger' | 'warning' | 'info';
    }>({
        open: false,
        title: '',
        message: '',
        action: async () => { },
        confirmText: 'Confirm',
        type: 'danger'
    })

    const handleModalToggleSubtask = async (taskId: string, idx: number) => {
        const t = tasks.find(item => item.id === taskId)
        if (!t?.notes || t.notes.type !== 'checklist') return

        const newContent = [...(t.notes.content as any[])]
        newContent[idx] = { ...newContent[idx], completed: !newContent[idx].completed }

        await editTask(taskId, {
            notes: {
                type: t.notes.type,
                content: newContent
            }
        })
        setSelectedTaskForModal(prev => {
            if (prev?.id === taskId && prev.notes && prev.notes.type === 'checklist') {
                return {
                    ...prev,
                    notes: {
                        type: prev.notes.type,
                        content: newContent
                    }
                }
            }
            return prev
        })
    }

    const handleModalToggleComplete = async (taskId: string, completed: boolean) => {
        await toggleTask(taskId, completed)
        setSelectedTaskForModal(prev => prev?.id === taskId ? { ...prev, is_completed: completed } : prev)
    }

    // Intelligent Task System states
    const [isAnalyzingPriority, setIsAnalyzingPriority] = useState(false)
    const [suggestedPriority, setSuggestedPriority] = useState<{ level: 'super' | 'high' | 'mid' | 'low', reason: string } | null>(null)
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Derived autocomplete from history
    const autocompleteTitles = useMemo(() => {
        if (!newTask.trim() || newTask.length < 2) return []
        const lowerInput = newTask.toLowerCase()
        // Unique titles from existing tasks that contain the input, excluding exact match
        const matches = Array.from(new Set(tasks.map(t => t.title)))
            .filter(t => t.toLowerCase().includes(lowerInput) && t.toLowerCase() !== lowerInput)
            .slice(0, 3)
        return matches
    }, [newTask, tasks])

    // Debounced Smart Priority Analysis
    useEffect(() => {
        if (!newTask.trim() || newTask.length < 3 || category !== 'todo') {
            setSuggestedPriority(null)
            setIsAnalyzingPriority(false)
            return
        }

        setIsAnalyzingPriority(true)
        const timeout = setTimeout(async () => {
            try {
                // Get current workload context
                const openCount = tasks.filter(t => !t.is_completed).length
                const dist = tasks.reduce((acc, t) => {
                    if (!t.is_completed && t.priority) {
                        acc[t.priority] = (acc[t.priority] || 0) + 1
                    }
                    return acc
                }, {} as Record<string, number>)

                const res = await fetch('/api/smart-task', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: newTask,
                        openTasksCount: openCount,
                        priorityDistribution: dist
                    })
                })

                if (res.ok) {
                    const data = await res.json()
                    // Only show suggestion if it's different to current selected
                    if (data.priority && data.priority !== priority) {
                        setSuggestedPriority({ level: data.priority, reason: data.reason })
                    } else {
                        setSuggestedPriority(null)
                    }
                }
            } catch (err) {
                console.error('Smart priority failed', err)
                setSuggestedPriority(null)
            } finally {
                setIsAnalyzingPriority(false)
            }
        }, 800) // 800ms debounce

        return () => clearTimeout(timeout)
    }, [newTask, priority, category, tasks])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return

        try {
            let finalTitle = newTask.trim()
            let finalAmount = amount.trim()
            if (category === 'grocery' && finalAmount && !finalAmount.startsWith('x')) {
                finalAmount = `x${finalAmount}`
            }

            await createTask(
                finalTitle,
                priority,
                dueDateMode !== 'none' && dueDateMode !== 'recurring' ? dueDate || undefined : undefined,
                category === 'grocery' ? finalAmount : undefined,
                dueDateMode !== 'none' && dueDateMode !== 'recurring' ? (dueDateMode as 'on' | 'before' | 'range') : undefined,
                endDate || undefined,
                dueDateMode === 'recurring' ? { type: recurringType, time: recurringTime || undefined, duration_minutes: recurringDuration ? parseInt(recurringDuration) : undefined, days_of_week: recurringType === 'custom' ? recurringDays : undefined } : {},
                showCreateNotes ? { type: createNotesType, content: createNotesContent } : undefined
            )
            setNewTask('')
            setAmount('1')
            setPriority('low')
            setDueDate('')
            setDueDateMode('none')
            setEndDate('')
            setRecurringType('off_days')
            setRecurringTime('')
            setRecurringDuration('60')
            setRecurringDays([])
            setShowCreateNotes(false)
            setCreateNotesContent('')
            setCreateNotesType('text')
        } catch (err: any) {
            console.error('Operation creation failed:', err)
            alert(err.message || 'Failed to create operation. Please check your connection.')
        }
    }

    const handleClearAll = () => {
        const itemType = category === 'todo' ? 'operations' : category === 'grocery' ? 'groceries' : 'reminders'
        setConfirmModal({
            open: true,
            title: `Clear All ${category === 'todo' ? 'Operations' : category === 'grocery' ? 'Groceries' : 'Reminders'}?`,
            message: `Are you sure you want to delete every item in this list? This action cannot be undone.`,
            confirmText: 'Yes, Clear All',
            type: 'danger',
            action: async () => {
                await clearAllTasks()
                setConfirmModal(prev => ({ ...prev, open: false }))
            }
        })
    }

    const handleClearCompleted = () => {
        const itemType = category === 'todo' ? 'completed operations' : category === 'grocery' ? 'completed groceries' : 'completed reminders'
        setConfirmModal({
            open: true,
            title: 'Clear Completed?',
            message: `Are you sure you want to remove all ${itemType}?`,
            confirmText: 'Yes, Clear Completed',
            type: 'danger',
            action: async () => {
                await clearCompletedTasks()
                setConfirmModal(prev => ({ ...prev, open: false }))
            }
        })
    }

    const handleDeleteWithSafety = (task: Task) => {
        setConfirmModal({
            open: true,
            title: 'Delete Operation?',
            message: `Are you sure you want to delete "${task.title}"?`,
            confirmText: 'Yes, Delete',
            type: 'danger',
            action: async () => {
                setLastDeletedTask(task)
                setShowUndo(true)
                await deleteTask(task.id)
                setConfirmModal(prev => ({ ...prev, open: false }))
                setTimeout(() => setShowUndo(false), 5000)
            }
        })
    }

    const handleUndo = async () => {
        if (lastDeletedTask) {
            const t = lastDeletedTask
            await createTask(
                t.title,
                t.priority || 'low',
                t.due_date,
                t.amount,
                t.due_date_mode as any,
                t.end_date,
                t.recurrence_config
            )
            setLastDeletedTask(null)
            setShowUndo(false)
        }
    }

    // Sort: Uncompleted first (sorted by manual position), Completed last (sorted by manual position).
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.is_completed !== b.is_completed) {
            return a.is_completed ? 1 : -1
        }
        // Use position DESC (higher position at the top)
        return (b.position || 0) - (a.position || 0)
    })

    // Expand recurring "off-day" tasks: one virtual entry per off-day in the current off period
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const currentOffPeriod = getNextOffPeriod(today) // finds current block if today is off-day too
    const offDays: Date[] = []
    if (currentOffPeriod.start.getTime() !== currentOffPeriod.end.getTime() || !isShiftDay(currentOffPeriod.start)) {
        let d = new Date(currentOffPeriod.start)
        while (d <= currentOffPeriod.end) {
            offDays.push(new Date(d))
            d.setDate(d.getDate() + 1)
        }
    }

    // Expand recurring tasks: Only include if the task's recurrence rule applies to TODAY.
    // It will show up once on the list for today.
    const dateStr = today.toISOString().split('T')[0]
    const dayOfWeek = today.getDay()
    const expandedTasks: (Task & { _recurringDate?: string })[] = []

    sortedTasks.forEach(task => {
        // Only apply special filtering if it HAS a valid recurrence type
        if (task.recurrence_config && task.recurrence_config.type && task.recurrence_config.type !== 'none') {
            const type = task.recurrence_config.type
            const daysOfWeek = task.recurrence_config.days_of_week || []
            let shouldInclude = false

            if (type === 'daily') shouldInclude = true
            else if (type === 'work_days' && isShiftDay(today)) shouldInclude = true
            else if (type === 'off_days' && !isShiftDay(today)) shouldInclude = true
            else if (type === 'custom' && daysOfWeek.includes(dayOfWeek)) shouldInclude = true

            // Legacy fallback support
            if ((type as any) === 'shift_relative') {
                if ((task.recurrence_config as any).target === 'off_days' && !isShiftDay(today)) shouldInclude = true
                if ((task.recurrence_config as any).target === 'on_days' && isShiftDay(today)) shouldInclude = true
            }

            if (shouldInclude) {
                expandedTasks.push({ ...task, id: `${task.id}__${dateStr}`, _recurringDate: dateStr })
            }
        } else {
            // Task has NO recurrence or type is 'none' -> ALWAYS include
            expandedTasks.push(task)
        }
    })

    return (
        <div className="bg-white rounded-xl border border-black/[0.08] p-4 sm:p-5 shadow-sm flex flex-col min-h-[500px] relative">
            {/* Confirmation Modal */}
            {confirmModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))} />
                    <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                            confirmModal.type === 'danger' ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-black mb-2">{confirmModal.title}</h3>
                        <p className="text-[14px] text-black/60 mb-6 leading-relaxed">
                            {confirmModal.message}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                                className="flex-1 py-3 rounded-xl border border-black/[0.1] text-black/60 font-bold text-[14px] hover:bg-black/[0.05] transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={confirmModal.action}
                                className={cn(
                                    "flex-1 py-3 rounded-xl text-white font-bold text-[14px] transition-colors shadow-lg",
                                    confirmModal.type === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                                )}
                            >
                                {confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-black" />
                    </div>
                    <div>
                        <h2 className="text-[16px] font-bold text-black tracking-tight">{title}</h2>
                        <p className="text-[12px] text-black/50">{tasks.filter(t => !t.is_completed).length} pending</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {tasks.some(t => t.is_completed) && (
                        <button
                            onClick={handleClearCompleted}
                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 rounded hover:bg-emerald-50 bg-emerald-50/50"
                        >
                            Clear Completed
                        </button>
                    )}
                    {tasks.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-[11px] font-medium text-black/40 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                        >
                            All
                        </button>
                    )}
                </div>
            </div>

            {showUndo && (
                <div className="mb-4 p-3 bg-black text-white rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-[12px] font-medium">Operation deleted</span>
                    <button
                        onClick={handleUndo}
                        className="text-[12px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1"
                    >
                        Undo
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mb-5 flex flex-col gap-2">
                <div className="flex gap-1.5 sm:gap-2">
                    {category === 'grocery' && (
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="x1"
                            className="w-12 sm:w-16 bg-black/[0.03] border border-black/[0.08] rounded-xl px-1 sm:px-2 py-2.5 text-[13px] text-center text-black placeholder-black/30 outline-none focus:border-black/40 transition-colors shrink-0"
                        />
                    )}
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder={`Add new ${category === 'todo' ? 'operation' : 'item'}...`}
                        className="flex-1 min-w-0 bg-black/[0.03] border border-black/[0.08] rounded-xl px-3 sm:px-4 py-2.5 text-[13px] text-black placeholder-black/30 outline-none focus:border-black/40 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newTask.trim() || loading}
                        className="w-11 h-11 rounded-xl bg-black flex items-center justify-center text-white hover:bg-neutral-800 transition-all shrink-0 disabled:opacity-50 shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    {(newTask.trim().length > 0 || dueDateMode !== 'none') && (
                        <button
                            type="button"
                            onClick={() => {
                                setNewTask('')
                                setAmount('')
                                setDueDateMode('none')
                                setPriority(undefined as any)
                                setRecurringType('off_days')
                                setRecurringTime('')
                                setRecurringDuration('')
                                setShowSuggestions(false)
                            }}
                            className="w-11 h-11 rounded-xl bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/40 hover:text-red-500 transition-colors shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Tier 1: Local Autocomplete Suggestions */}
                {autocompleteTitles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-1 animate-in slide-in-from-top-1 fade-in duration-200">
                        {autocompleteTitles.map(title => (
                            <button
                                key={title}
                                type="button"
                                onClick={() => setNewTask(title)}
                                className="px-2 py-1 bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.05] rounded-lg text-[11px] font-medium text-black/60 transition-colors tracking-tight text-left truncate max-w-[200px]"
                            >
                                {title}
                            </button>
                        ))}
                    </div>
                )}

                {/* Main Form Fields (expanded when typing or date set) */}
                {(newTask.trim().length > 0 || dueDateMode !== 'none') && (
                    <div className="flex flex-col gap-2 animate-in slide-in-from-top-1 fade-in duration-200">

                        {/* Tier 2: AI Priority Suggestion Badge */}
                        {category === 'todo' && (
                            <div className="h-[24px] flex items-center px-1">
                                {isAnalyzingPriority ? (
                                    <div className="flex items-center gap-1.5 text-black/30">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest">Analyzing priority...</span>
                                    </div>
                                ) : suggestedPriority ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPriority(suggestedPriority.level)
                                            setSuggestedPriority(null)
                                        }}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-95 group",
                                            PRIORITY_CONFIG[suggestedPriority.level].color,
                                            "shadow-sm ring-2 ring-offset-1 ring-black/5"
                                        )}
                                    >
                                        <span className="opacity-70 group-hover:opacity-100">✨ Make {suggestedPriority.level} Priority</span>
                                        <div className="w-px h-2.5 bg-current opacity-20" />
                                        <span className="opacity-50 text-[9px] lowercase tracking-normal font-medium">{suggestedPriority.reason}</span>
                                    </button>
                                ) : null}
                            </div>
                        )}

                        {/* Priority row */}
                        <div className="flex gap-1.5 p-1 bg-black/[0.03] rounded-xl border border-black/5 w-fit">
                            {(['super', 'high', 'mid', 'low'] as const).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={cn(
                                        "px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all uppercase tracking-tight",
                                        priority === p
                                            ? PRIORITY_CONFIG[p].color + " shadow-sm scale-105"
                                            : "bg-transparent text-black/30 border-transparent hover:text-black/50 hover:bg-black/5"
                                    )}
                                >
                                    {PRIORITY_CONFIG[p].label}
                                </button>
                            ))}
                        </div>

                        {/* Date mode selector */}
                        <div className="flex flex-wrap gap-1.5">
                            {(['none', 'on', 'before', 'range', 'recurring'] as const).map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setDueDateMode(mode)}
                                    className={cn(
                                        "px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all uppercase tracking-tight flex items-center gap-1",
                                        dueDateMode === mode
                                            ? mode === 'recurring' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-black text-white border-black'
                                            : 'bg-black/[0.03] border-black/5 text-black/40 hover:text-black/60'
                                    )}
                                >
                                    {mode === 'none' && '✕ None'}
                                    {mode === 'on' && '📅 On'}
                                    {mode === 'before' && '⏰ By'}
                                    {mode === 'range' && '↔ Range'}
                                    {mode === 'recurring' && '🔁 Recurring'}
                                </button>
                            ))}
                        </div>

                        {/* Date fields — hidden when None or Recurring */}
                        {dueDateMode !== 'none' && dueDateMode !== 'recurring' && (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-black/[0.03] border border-black/5 rounded-xl px-3 py-1.5">
                                    <Calendar className="w-3 h-3 text-black/30 shrink-0" />
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="bg-transparent text-[11px] font-bold text-black/60 outline-none uppercase tracking-tight w-full"
                                    />
                                </div>
                                {dueDateMode === 'range' && (
                                    <div className="flex items-center gap-2 bg-black/[0.03] border border-black/5 rounded-xl px-3 py-1.5">
                                        <span className="text-[10px] font-bold text-black/20 uppercase tracking-tighter">to</span>
                                        <Calendar className="w-3 h-3 text-black/30 shrink-0" />
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-black/60 outline-none uppercase tracking-tight w-full"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recurring sub-panel */}
                        {dueDateMode === 'recurring' && (
                            <div className="flex flex-col gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <div className="flex flex-wrap gap-1.5">
                                    {([
                                        { value: 'daily', label: 'Daily' },
                                        { value: 'work_days', label: 'Work Days' },
                                        { value: 'off_days', label: 'Days Off' },
                                        { value: 'custom', label: 'Custom' },
                                    ] as const).map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setRecurringType(opt.value)}
                                            className={cn(
                                                "px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all uppercase tracking-tight",
                                                recurringType === opt.value
                                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                                    : 'bg-white text-black/40 border-emerald-200 hover:text-black/60'
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Weekly day picker */}
                                {(recurringType === 'custom') && (
                                    <div className="flex gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                                        {[
                                            { d: 'M', v: 1 },
                                            { d: 'T', v: 2 },
                                            { d: 'W', v: 3 },
                                            { d: 'Th', v: 4 },
                                            { d: 'F', v: 5 },
                                            { d: 'Sa', v: 6 },
                                            { d: 'Su', v: 0 }
                                        ].map((day) => (
                                            <button
                                                key={day.v}
                                                type="button"
                                                onClick={() => {
                                                    setRecurringDays(prev =>
                                                        prev.includes(day.v)
                                                            ? prev.filter(d => d !== day.v)
                                                            : [...prev, day.v]
                                                    )
                                                }}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg text-[11px] font-bold border transition-all",
                                                    recurringDays.includes(day.v)
                                                        ? "bg-emerald-600 border-emerald-700 text-white shadow-sm"
                                                        : "bg-white border-emerald-200 text-black/40 hover:bg-emerald-50 hover:border-emerald-300"
                                                )}
                                            >
                                                {day.d}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Time + Duration */}
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1.5 bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5">
                                        <span className="text-[10px] font-bold text-black/40 uppercase">Time</span>
                                        <input
                                            type="time"
                                            value={recurringTime}
                                            onChange={e => setRecurringTime(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-black/60 outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5">
                                        <span className="text-[10px] font-bold text-black/40 uppercase">Duration</span>
                                        <select
                                            value={recurringDuration}
                                            onChange={e => setRecurringDuration(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-black/60 outline-none"
                                        >
                                            {[30, 60, 90, 120, 150, 180, 240, 300, 360].map(mins => {
                                                const hrs = mins / 60
                                                const label = hrs >= 1 ? `${hrs}${hrs % 1 === 0 ? '' : '.5'}h` : `${mins}m`
                                                return <option key={mins} value={mins}>{label}</option>
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes Creator */}
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCreateNotes(!showCreateNotes)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all w-fit uppercase tracking-wider",
                                    showCreateNotes
                                        ? "bg-black text-white border-black"
                                        : "bg-white text-black/40 border-black/10 hover:border-black/20"
                                )}
                            >
                                <LayoutList className="w-3.5 h-3.5" />
                                {showCreateNotes ? "Hide Notes" : "Add Notes/Checklist"}
                            </button>

                            {showCreateNotes && (
                                <div className="flex flex-col gap-3 p-3 bg-black/[0.03] border border-black/5 rounded-xl animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex gap-1.5">
                                        {([
                                            { type: 'text', icon: Type, label: 'Text' },
                                            { type: 'bullets', icon: List, label: 'Bullets' },
                                            { type: 'checklist', icon: ListChecks, label: 'Checklist' },
                                        ] as const).map(noteType => (
                                            <button
                                                key={noteType.type}
                                                type="button"
                                                onClick={() => {
                                                    setCreateNotesType(noteType.type)
                                                    if (noteType.type === 'checklist' && !Array.isArray(createNotesContent)) {
                                                        setCreateNotesContent([])
                                                    } else if (noteType.type !== 'checklist' && Array.isArray(createNotesContent)) {
                                                        setCreateNotesContent('')
                                                    }
                                                }}
                                                className={cn(
                                                    "px-2 py-1 text-[9px] font-bold rounded-lg border transition-all uppercase tracking-tight flex items-center gap-1",
                                                    createNotesType === noteType.type
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white text-black/40 border-black/10 hover:text-black/60'
                                                )}
                                            >
                                                <noteType.icon className="w-3 h-3" />
                                                {noteType.label}
                                            </button>
                                        ))}
                                    </div>

                                    {createNotesType === 'text' && (
                                        <textarea
                                            value={createNotesContent}
                                            onChange={(e) => setCreateNotesContent(e.target.value)}
                                            placeholder="Add some notes..."
                                            className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-[12px] text-black outline-none focus:border-black/30 min-h-[60px]"
                                        />
                                    )}

                                    {createNotesType === 'bullets' && (
                                        <textarea
                                            value={createNotesContent}
                                            onChange={(e) => setCreateNotesContent(e.target.value)}
                                            placeholder="Add bullet points, one per line..."
                                            className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-[12px] text-black outline-none focus:border-black/30 min-h-[60px]"
                                        />
                                    )}

                                    {createNotesType === 'checklist' && (
                                        <div className="flex flex-col gap-2">
                                            {(createNotesContent as any[]).map((item: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-3 py-1.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.completed}
                                                        onChange={() => {
                                                            const newC = [...createNotesContent]
                                                            newC[index] = { ...newC[index], completed: !newC[index].completed }
                                                            setCreateNotesContent(newC)
                                                        }}
                                                        className="w-4 h-4 accent-black cursor-pointer shrink-0"
                                                    />
                                                    <span className={cn(
                                                        "flex-1 text-[12px] text-black",
                                                        item.completed && "line-through text-black/40"
                                                    )}>
                                                        {item.text}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCreateNotesContent(createNotesContent.filter((_: any, i: number) => i !== index))
                                                        }}
                                                        className="text-black/30 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={newCreateChecklistItem}
                                                    onChange={(e) => setNewCreateChecklistItem(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault()
                                                            if (newCreateChecklistItem.trim()) {
                                                                setCreateNotesContent([...createNotesContent, { text: newCreateChecklistItem.trim(), completed: false }])
                                                                setNewCreateChecklistItem('')
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Add new item..."
                                                    className="flex-1 bg-white border border-black/10 rounded-lg px-3 py-1.5 text-[12px] text-black outline-none focus:border-black/30"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (newCreateChecklistItem.trim()) {
                                                            setCreateNotesContent([...createNotesContent, { text: newCreateChecklistItem.trim(), completed: false }])
                                                            setNewCreateChecklistItem('')
                                                        }
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </form>

            <Reorder.Group
                axis="y"
                values={sortedTasks}
                onReorder={updateTaskPositions}
                className="flex-1 pr-1 space-y-2 no-scrollbar"
            >
                {loading && tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                        <RefreshCw className="w-5 h-5 text-black/20 animate-spin" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                        <p className="text-[13px] font-medium text-black/40">All caught up.</p>
                        <p className="text-[11px] text-black/30">Add something above to get started.</p>
                    </div>
                ) : (
                    sortedTasks.map((task) => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            toggleTask={toggleTask}
                            deleteTask={handleDeleteWithSafety}
                            editTask={editTask}
                            category={category}
                        />
                    ))
                )}
            </Reorder.Group>

            <TaskDetailModal
                task={selectedTaskForModal}
                isOpen={!!selectedTaskForModal}
                onClose={() => setSelectedTaskForModal(null)}
                onToggleSubtask={handleModalToggleSubtask}
                onToggleComplete={handleModalToggleComplete}
            />
        </div>
    )
}


function TaskRow({ task, toggleTask, deleteTask, editTask, category }: { task: Task, toggleTask: any, deleteTask: any, editTask: any, category: string }) {
    const controls = useDragControls()
    const [isEditing, setIsEditing] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [editValue, setEditValue] = useState(task.title)
    const [editAmount, setEditAmount] = useState(task.amount || '')
    const [editPriority, setEditPriority] = useState(task.priority || 'low')
    const [editDueDate, setEditDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '')
    const [editEndDate, setEditEndDate] = useState(task.end_date ? task.end_date.split('T')[0] : '')
    const [editDueDateMode, setEditDueDateMode] = useState<'none' | 'on' | 'before' | 'range' | 'recurring'>(task.recurrence_config?.type && task.recurrence_config.type !== 'none' ? 'recurring' : (task.due_date_mode || 'none'))
    const [editRecurrence, setEditRecurrence] = useState<'daily' | 'work_days' | 'off_days' | 'custom'>(task.recurrence_config?.type && task.recurrence_config.type !== 'none' ? task.recurrence_config.type as any : 'off_days')
    const [editRecurringTime, setEditRecurringTime] = useState(task.recurrence_config?.time || '')
    const [editRecurringDuration, setEditRecurringDuration] = useState(task.recurrence_config?.duration_minutes?.toString() || '60')
    const [editRecurringDays, setEditRecurringDays] = useState<number[]>(task.recurrence_config?.days_of_week || [])
    const [editProfile, setEditProfile] = useState(task.profile)
    const [editNotesType, setEditNotesType] = useState<'text' | 'bullets' | 'checklist'>(task.notes?.type || 'text')
    const [editNotesContent, setEditNotesContent] = useState<any>(task.notes?.content || '')
    const [newChecklistItem, setNewChecklistItem] = useState('')

    // Reset edit states to DB truth whenever editing starts
    useEffect(() => {
        if (isEditing) {
            setEditValue(task.title)
            setEditAmount(task.amount || '')
            setEditPriority(task.priority || 'low')
            setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '')
            setEditEndDate(task.end_date ? task.end_date.split('T')[0] : '')
            setEditDueDateMode(task.recurrence_config?.type && task.recurrence_config.type !== 'none' ? 'recurring' : (task.due_date_mode || 'none'))
            setEditRecurrence(task.recurrence_config?.type && task.recurrence_config.type !== 'none' ? task.recurrence_config.type as any : 'off_days')
            setEditRecurringTime(task.recurrence_config?.time || '')
            setEditRecurringDuration(task.recurrence_config?.duration_minutes?.toString() || '60')
            setEditRecurringDays(task.recurrence_config?.days_of_week || [])
            setEditProfile(task.profile)
            setEditNotesType(task.notes?.type || 'text')
            setEditNotesContent(task.notes?.content || (task.notes?.type === 'checklist' ? [] : ''))
        }
    }, [isEditing, task])

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!editValue.trim()) return

        const updates: Partial<Task> = {
            title: editValue.trim(),
            notes: {
                type: editNotesType,
                content: editNotesContent
            }
        }
        if (editAmount.trim() !== (task.amount || '')) {
            let val = editAmount.trim()
            if (category === 'grocery' && val && !val.startsWith('x')) val = `x${val}`
            updates.amount = val
        }
        if (editPriority !== task.priority) updates.priority = editPriority
        if (editProfile !== task.profile) updates.profile = editProfile as any
        if (editDueDate !== (task.due_date ? task.due_date.split('T')[0] : '')) {
            updates.due_date = editDueDate || undefined
            if (!editDueDate) updates.due_date_mode = 'on'
        }

        if (editEndDate !== (task.end_date ? task.end_date.split('T')[0] : '')) {
            updates.end_date = editEndDate || undefined
        }

        if (editDueDateMode === 'recurring') {
            updates.recurrence_config = {
                type: editRecurrence,
                time: editRecurringTime || undefined,
                duration_minutes: editRecurringDuration ? parseInt(editRecurringDuration) : undefined,
                days_of_week: editRecurrence === 'custom' ? editRecurringDays : undefined
            }
            updates.due_date = undefined
            updates.due_date_mode = undefined
        } else if (editDueDateMode === 'none') {
            updates.recurrence_config = { type: 'none' }
            updates.due_date = undefined
            updates.due_date_mode = undefined
        } else {
            updates.recurrence_config = { type: 'none' }
            if (editDueDateMode !== (task.due_date_mode || 'on')) updates.due_date_mode = editDueDateMode as 'on' | 'before' | 'range'
        }

        if (Object.keys(updates).length > 0) {
            editTask(task.id, updates)
        }
        setIsEditing(false)
    }

    const handleToggleSubtask = async (subindex: number) => {
        if (task.notes?.type !== 'checklist') return
        const newContent = [...(task.notes.content as any[])]
        newContent[subindex] = { ...newContent[subindex], completed: !newContent[subindex].completed }

        await editTask(task.id, {
            notes: {
                ...task.notes,
                content: newContent
            }
        })
    }

    const handleAddChecklistItem = () => {
        if (newChecklistItem.trim()) {
            setEditNotesContent((prev: any[]) => [...prev, { text: newChecklistItem.trim(), completed: false }])
            setNewChecklistItem('')
        }
    }

    const handleToggleChecklistItem = (index: number) => {
        setEditNotesContent((prev: any[]) =>
            prev.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item))
        )
    }

    const handleRemoveChecklistItem = (index: number) => {
        setEditNotesContent((prev: any[]) => prev.filter((_, i) => i !== index))
    }

    if (isEditing) {
        return (
            <div className="flex flex-col gap-3 p-3 rounded-xl border bg-white border-black/[0.15] shadow-lg animate-in fade-in zoom-in-95 duration-200">
                <div className="flex gap-2">
                    {category === 'grocery' && (
                        <input
                            type="text"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="x1"
                            className="w-16 bg-black/[0.03] border border-black/[0.08] rounded-lg px-2 py-1.5 text-[13px] text-center text-black font-bold outline-none focus:border-black/30"
                        />
                    )}
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 bg-black/[0.03] border border-black/[0.08] rounded-lg px-3 py-1.5 text-[14px] text-black outline-none focus:border-black/30 placeholder:text-black/20"
                        placeholder="Operation title..."
                        autoFocus
                    />
                </div>

                <div className="flex flex-col gap-3">
                    {/* Notes Editor */}
                    <div className="flex flex-col gap-2 p-2.5 bg-black/[0.03] border border-black/5 rounded-xl">
                        <div className="flex gap-1.5">
                            {([
                                { type: 'text', icon: Type, label: 'Text' },
                                { type: 'bullets', icon: List, label: 'Bullets' },
                                { type: 'checklist', icon: ListChecks, label: 'Checklist' },
                            ] as const).map(noteType => (
                                <button
                                    key={noteType.type}
                                    type="button"
                                    onClick={() => {
                                        setEditNotesType(noteType.type)
                                        if (noteType.type === 'checklist' && !Array.isArray(editNotesContent)) {
                                            setEditNotesContent([])
                                        } else if (noteType.type !== 'checklist' && Array.isArray(editNotesContent)) {
                                            setEditNotesContent('')
                                        }
                                    }}
                                    className={cn(
                                        "px-2 py-1 text-[9px] font-bold rounded-lg border transition-all uppercase tracking-tight flex items-center gap-1",
                                        editNotesType === noteType.type
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-black/40 border-black/10 hover:text-black/60'
                                    )}
                                >
                                    <noteType.icon className="w-3 h-3" />
                                    {noteType.label}
                                </button>
                            ))}
                        </div>

                        {editNotesType === 'text' && (
                            <textarea
                                value={editNotesContent}
                                onChange={(e) => setEditNotesContent(e.target.value)}
                                placeholder="Add some notes..."
                                className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-[12px] text-black outline-none focus:border-black/30 min-h-[60px]"
                            />
                        )}

                        {editNotesType === 'bullets' && (
                            <textarea
                                value={editNotesContent}
                                onChange={(e) => setEditNotesContent(e.target.value)}
                                placeholder="Add bullet points, one per line..."
                                className="w-full bg-white border border-black/10 rounded-lg px-3 py-2 text-[12px] text-black outline-none focus:border-black/30 min-h-[60px]"
                            />
                        )}

                        {editNotesType === 'checklist' && (
                            <div className="flex flex-col gap-2">
                                {editNotesContent.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2 bg-white border border-black/10 rounded-lg px-3 py-1.5">
                                        <input
                                            type="checkbox"
                                            checked={item.completed}
                                            onChange={() => handleToggleChecklistItem(index)}
                                            className="w-4 h-4 accent-black cursor-pointer shrink-0"
                                        />
                                        <span className={cn(
                                            "flex-1 text-[12px] text-black",
                                            item.completed && "line-through text-black/40"
                                        )}>
                                            {item.text}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveChecklistItem(index)}
                                            className="text-black/30 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newChecklistItem}
                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddChecklistItem()
                                            }
                                        }}
                                        placeholder="Add new item..."
                                        className="flex-1 bg-white border border-black/10 rounded-lg px-3 py-1.5 text-[12px] text-black outline-none focus:border-black/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddChecklistItem}
                                        className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Scheduling Options */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Date/Recurrence mode selector */}
                        <div className="flex flex-wrap gap-1.5">
                            {(['none', 'on', 'before', 'range', 'recurring'] as const).map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setEditDueDateMode(mode)}
                                    className={cn(
                                        "px-2 py-1 text-[9px] font-bold rounded-lg border transition-all uppercase tracking-tight",
                                        editDueDateMode === mode
                                            ? mode === 'recurring' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-black text-white border-black'
                                            : 'bg-black/[0.03] border-black/5 text-black/40 hover:text-black/60'
                                    )}
                                >
                                    {mode === 'none' && 'None'}
                                    {mode === 'on' && 'On'}
                                    {mode === 'before' && 'By'}
                                    {mode === 'range' && 'Range'}
                                    {mode === 'recurring' && '🔁 Recurring'}
                                </button>
                            ))}
                        </div>

                        {/* Date inputs — hidden when None or Recurring */}
                        {editDueDateMode !== 'none' && editDueDateMode !== 'recurring' && (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 bg-black/[0.03] border border-black/5 rounded-lg px-2.5 py-1 min-w-[110px]">
                                    <Calendar className="w-3 h-3 text-black/30 shrink-0" />
                                    <input
                                        type="date"
                                        value={editDueDate}
                                        onChange={(e) => setEditDueDate(e.target.value)}
                                        className="bg-transparent text-[10px] font-bold text-black/60 outline-none uppercase tracking-tight w-full"
                                    />
                                </div>
                                {editDueDateMode === 'range' && (
                                    <>
                                        <span className="text-[10px] font-bold text-black/20 uppercase tracking-tighter">to</span>
                                        <div className="flex items-center gap-2 bg-black/[0.03] border border-black/5 rounded-lg px-2.5 py-1 min-w-[110px]">
                                            <Calendar className="w-3 h-3 text-black/30 shrink-0" />
                                            <input
                                                type="date"
                                                value={editEndDate}
                                                onChange={(e) => setEditEndDate(e.target.value)}
                                                className="bg-transparent text-[10px] font-bold text-black/60 outline-none uppercase tracking-tight w-full"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Recurring sub-panel */}
                        {editDueDateMode === 'recurring' && (
                            <div className="flex flex-col gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <div className="flex flex-wrap gap-1">
                                    {(['daily', 'work_days', 'off_days', 'custom'] as const).map(rt => (
                                        <button
                                            key={rt}
                                            type="button"
                                            onClick={() => setEditRecurrence(rt as any)}
                                            className={cn(
                                                "px-2 py-0.5 text-[9px] font-bold rounded-md border transition-all uppercase tracking-tight",
                                                editRecurrence === rt
                                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                                    : 'bg-white text-black/40 border-emerald-200 hover:text-black/60'
                                            )}
                                        >
                                            {rt.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-md px-2 py-1">
                                        <span className="text-[9px] font-bold text-black/40 uppercase">Time</span>
                                        <input type="time" value={editRecurringTime} onChange={e => setEditRecurringTime(e.target.value)} className="bg-transparent text-[10px] font-bold text-black/60 outline-none" />
                                    </div>
                                    <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-md px-2 py-1 flex-1">
                                        <span className="text-[9px] font-bold text-black/40 uppercase">Dur.</span>
                                        <select value={editRecurringDuration} onChange={e => setEditRecurringDuration(e.target.value)} className="bg-transparent text-[10px] font-bold text-black/60 outline-none w-full">
                                            <option value="">Duration</option>
                                            {[30, 60, 90, 120, 150, 180, 240, 300, 360].map(mins => {
                                                const hrs = mins / 60
                                                const label = hrs >= 1 ? `${hrs}${hrs % 1 === 0 ? '' : '.5'}h` : `${mins}m`
                                                return <option key={mins} value={mins}>{label}</option>
                                            })}
                                        </select>
                                    </div>
                                </div>
                                {editRecurrence === 'custom' && (
                                    <div className="flex gap-1 mt-1 animate-in fade-in zoom-in-95 duration-200">
                                        {[
                                            { d: 'M', v: 1 },
                                            { d: 'T', v: 2 },
                                            { d: 'W', v: 3 },
                                            { d: 'Th', v: 4 },
                                            { d: 'F', v: 5 },
                                            { d: 'Sa', v: 6 },
                                            { d: 'Su', v: 0 }
                                        ].map((day) => (
                                            <button
                                                key={day.v}
                                                type="button"
                                                onClick={() => {
                                                    setEditRecurringDays(prev =>
                                                        prev.includes(day.v)
                                                            ? prev.filter(d => d !== day.v)
                                                            : [...prev, day.v]
                                                    )
                                                }}
                                                className={cn(
                                                    "w-7 h-7 rounded-md text-[10px] font-bold border transition-all",
                                                    editRecurringDays.includes(day.v)
                                                        ? "bg-emerald-600 border-emerald-700 text-white"
                                                        : "bg-white border-emerald-200 text-black/40 hover:bg-emerald-50"
                                                )}
                                            >
                                                {day.d}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-y-3 gap-x-2 border-t border-black/5 pt-3">
                        <div className="flex gap-1 p-1 bg-black/[0.03] rounded-lg border border-black/5">
                            {(['super', 'high', 'mid', 'low'] as const).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setEditPriority(p)}
                                    className={cn(
                                        "px-2 py-1 text-[9px] font-bold rounded-md border transition-all uppercase tracking-tight whitespace-nowrap",
                                        editPriority === p
                                            ? PRIORITY_CONFIG[p].color + " shadow-sm"
                                            : "bg-transparent text-black/30 border-transparent hover:text-black/50"
                                    )}
                                >
                                    {PRIORITY_CONFIG[p].label}
                                </button>
                            ))}
                        </div>
                        {/* Profile Toggle */}
                        <div className="flex gap-1 p-1 bg-black/[0.03] rounded-lg border border-black/5">
                            {[
                                { id: 'personal', label: 'Personal', icon: User },
                                { id: 'business', label: 'Business', icon: Briefcase }
                            ].map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setEditProfile(p.id)}
                                    className={cn(
                                        "px-2 py-1 text-[9px] font-bold rounded-md border transition-all uppercase tracking-tight whitespace-nowrap flex items-center gap-1",
                                        editProfile === p.id
                                            ? "bg-white text-black border-black/[0.08] shadow-sm"
                                            : "bg-transparent text-black/30 border-transparent hover:text-black/50"
                                    )}
                                >
                                    <p.icon className="w-2.5 h-2.5" />
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-black/40 hover:text-black text-[12px] font-bold transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="px-4 py-1.5 bg-black text-white text-[12px] font-bold rounded-lg hover:bg-neutral-800 transition-colors shadow-sm">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const checklistItems = task.notes?.type === 'checklist' ? (task.notes.content as any[]) : []
    const completedSubtasks = checklistItems.filter(i => i.completed).length
    const totalSubtasks = checklistItems.length
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

    return (
        <Reorder.Item
            key={task.id}
            value={task}
            dragListener={false}
            dragControls={controls}
            className="touch-none"
        >
            <div className={cn(
                "group flex items-center gap-3 p-3 rounded-xl border transition-all relative overflow-hidden",
                task.is_completed
                    ? "bg-black/[0.02] border-transparent opacity-60"
                    : "bg-white border-black/[0.06] hover:border-black/[0.15] shadow-sm active:scale-[0.98] active:shadow-md"
            )}>
                {/* Drag Handle */}
                {!task.is_completed && (
                    <div
                        onPointerDown={(e) => controls.start(e)}
                        className="cursor-grab active:cursor-grabbing text-black/10 hover:text-black/30 transition-colors shrink-0 -ml-1 py-1"
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>
                )}
                <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => setSelectedTaskForModal(task)}
                >
                    <input
                        type="checkbox"
                        id={`task-${task.id}`}
                        checked={task.is_completed}
                        onChange={(e) => {
                            e.stopPropagation()
                            toggleTask(task.id, e.target.checked)
                        }}
                        className="w-5 h-5 rounded-lg border-2 border-black/10 checked:bg-black checked:border-black transition-all cursor-pointer accent-black shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            {category === 'grocery' && task.amount && (
                                <span className="text-[12px] font-bold text-black/40 shrink-0">{task.amount}</span>
                            )}
                            <span className={cn(
                                "text-[14px] font-bold truncate transition-all",
                                task.is_completed ? "text-black/30 line-through" : "text-black"
                            )}>
                                {task.title}
                            </span>
                            {task.priority && !task.is_completed && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0",
                                    PRIORITY_CONFIG[task.priority].color
                                )}>
                                    {task.priority}
                                </span>
                            )}
                        </div>
                        {/* Notes Teaser or Progress Bar */}
                        {!isEditing && (
                            <div className="mt-1 flex flex-col gap-1.5">
                                {task.notes?.type === 'checklist' && totalSubtasks > 0 && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-black/[0.05] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <span className="text-[9px] font-bold text-black/30 whitespace-nowrap">
                                            {completedSubtasks}/{totalSubtasks}
                                        </span>
                                    </div>
                                )}
                                {task.notes?.content && (
                                    <div className="relative mt-1">
                                        {!isExpanded ? (
                                            <div className="flex flex-col items-start gap-1">
                                                <p className="text-[11px] text-black/40 leading-relaxed line-clamp-1">
                                                    {task.notes.type === 'checklist'
                                                        ? (task.notes.content as any[]).map(i => (i.completed ? '✓ ' : '○ ') + i.text).join(', ')
                                                        : task.notes.content}
                                                </p>
                                                {(task.notes.content.length > 50 || (task.notes.type === 'checklist' && totalSubtasks > 1)) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setIsExpanded(true)
                                                        }}
                                                        className="text-[10px] font-bold text-black/20 hover:text-black/40 transition-colors uppercase tracking-tight"
                                                    >
                                                        + Show More
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {/* Expanded Checklist View */}
                                                {task.notes.type === 'checklist' && (
                                                    <div className="flex flex-col gap-2 pl-1 border-l-2 border-black/[0.03]">
                                                        {(task.notes.content as any[]).map((item, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-2 group/sub cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleToggleSubtask(idx)
                                                                }}
                                                            >
                                                                <div className={cn(
                                                                    "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all",
                                                                    item.completed ? "bg-emerald-500 border-emerald-500" : "bg-white border-black/10 group-hover/sub:border-black/30"
                                                                )}>
                                                                    {item.completed && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                                                                </div>
                                                                <span className={cn(
                                                                    "text-[11px] transition-all",
                                                                    item.completed ? "text-black/30 line-through" : "text-black/60 font-medium"
                                                                )}>
                                                                    {item.text}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Expanded Bullets/Text View */}
                                                {task.notes.type !== 'checklist' && (
                                                    <div className="text-[11px] text-black/60 whitespace-pre-wrap pl-3 border-l-2 border-black/[0.03] leading-relaxed font-medium">
                                                        {task.notes.content}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setIsExpanded(false)
                                                    }}
                                                    className="text-[10px] font-bold text-black/20 hover:text-black/40 transition-colors uppercase tracking-tight w-fit"
                                                >
                                                    - Show Less
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {task.due_date && !task.is_completed && (
                            <div className="flex items-center gap-1.5 text-[10px] text-black/30 font-bold uppercase tracking-wider mt-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {task.due_date_mode === 'before' && <span>On or Before </span>}
                                {task.due_date_mode === 'range' && <span>Range </span>}
                                <span>{new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                {task.due_date_mode === 'range' && task.end_date && (
                                    <>
                                        <span className="opacity-40">→</span>
                                        <span>{new Date(task.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition-all"
                        aria-label="Edit task"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => deleteTask(task)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-black/40 hover:text-red-500 hover:bg-red-50 transition-all"
                        aria-label="Delete task"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div >
        </Reorder.Item>
    )
}
