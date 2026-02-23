'use client'

import { useState, useMemo, useEffect } from 'react'
import { Activity, ShoppingCart, Bell, Plus, Trash2, RefreshCw, Edit2, Calendar } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { cn } from '@/lib/utils'
import type { Task } from '../types/tasks.types'
import { getNextOffPeriod, isShiftDay } from '@/features/finance/utils/rotaUtils'

const PRIORITY_CONFIG = {
    super: { label: 'Super', color: 'bg-blue-50 text-blue-600 border-blue-200', sort: 0 },
    high: { label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-200', sort: 1 },
    mid: { label: 'Mid', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', sort: 2 },
    low: { label: 'Low', color: 'bg-black/5 text-black/60 border-black/10', sort: 3 }
} as const

export function TaskList({ category, title, icon: Icon }: { category: 'todo' | 'grocery' | 'reminder', title: string, icon: any }) {
    const { tasks, loading, createTask, toggleTask, deleteTask, clearAllTasks, editTask } = useTasks(category)
    const [newTask, setNewTask] = useState('')
    const [amount, setAmount] = useState('1')
    const [priority, setPriority] = useState<'super' | 'high' | 'mid' | 'low'>('low')
    const [dueDate, setDueDate] = useState('')
    const [dueDateMode, setDueDateMode] = useState<'none' | 'on' | 'before' | 'range' | 'recurring'>('none')
    const [endDate, setEndDate] = useState('')
    const [recurringType, setRecurringType] = useState<'daily' | 'weekdays' | 'weekends' | 'work_days' | 'off_days' | 'weekly' | 'custom'>('off_days')
    const [recurringTime, setRecurringTime] = useState('')
    const [recurringDuration, setRecurringDuration] = useState('')

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
                dueDateMode === 'recurring' ? { type: recurringType, time: recurringTime || undefined, duration_minutes: recurringDuration ? parseInt(recurringDuration) : undefined } : {}
            )
            setNewTask('')
            setAmount('1')
            setPriority('low')
            setDueDate('')
            setDueDateMode('none')
            setEndDate('')
            setRecurringType('off_days')
            setRecurringTime('')
            setRecurringDuration('')
        } catch (err: any) {
            console.error('Operation creation failed:', err)
            alert(err.message || 'Failed to create operation. Please check your connection.')
        }
    }

    const handleClearAll = async () => {
        const itemType = category === 'todo' ? 'operations' : category === 'grocery' ? 'groceries' : 'reminders'
        if (window.confirm(`Are you sure you want to clear all ${itemType}? This cannot be undone.`)) {
            await clearAllTasks()
        }
    }

    // Sort: Uncompleted first (sorted by priority), Completed last.
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.is_completed !== b.is_completed) {
            return a.is_completed ? 1 : -1
        }
        if (!a.is_completed && !b.is_completed) {
            const aPriority = a.priority || 'low'
            const bPriority = b.priority || 'low'
            const aSort = PRIORITY_CONFIG[aPriority]?.sort ?? 3
            const bSort = PRIORITY_CONFIG[bPriority]?.sort ?? 3
            if (aSort !== bSort) return aSort - bSort
        }
        // Default to newest first
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
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

    // For recurring tasks that target off-days specifically, inject virtual copies for the current off period
    const expandedTasks: (Task & { _recurringDate?: string })[] = []
    sortedTasks.forEach(task => {
        const isOffDaysRecurring = task.recurrence_config?.type === 'off_days'
        if (isOffDaysRecurring && offDays.length > 0) {
            offDays.forEach(d => {
                const dateStr = d.toISOString().split('T')[0]
                expandedTasks.push({ ...task, id: `${task.id}__${dateStr}`, _recurringDate: dateStr })
            })
        } else {
            expandedTasks.push(task)
        }
    })

    return (
        <div className="bg-white rounded-xl border border-black/[0.08] p-4 sm:p-5 shadow-sm flex flex-col min-h-[500px]">
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
                {tasks.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="text-[12px] font-medium text-black/40 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                        Clear All
                    </button>
                )}
            </div>

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
                        className="w-11 h-11 rounded-xl bg-black flex items-center justify-center text-white hover:bg-neutral-800 transition-colors shrink-0 disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
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
                                        { value: 'weekdays', label: 'Weekdays' },
                                        { value: 'weekends', label: 'Weekends' },
                                        { value: 'work_days', label: 'Work Days' },
                                        { value: 'off_days', label: 'Days Off' },
                                        { value: 'weekly', label: 'Weekly' },
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
                                {(recurringType === 'weekly' || recurringType === 'custom') && (
                                    <div className="flex gap-1">
                                        {['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'].map((day, i) => {
                                            const dayNum = i === 6 ? 0 : i + 1
                                            return (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    className="w-7 h-7 rounded-md text-[10px] font-bold border border-emerald-200 bg-white text-black/50 hover:bg-emerald-100 transition-all"
                                                >
                                                    {day}
                                                </button>
                                            )
                                        })}
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
                                        <input
                                            type="number"
                                            placeholder="mins"
                                            value={recurringDuration}
                                            onChange={e => setRecurringDuration(e.target.value)}
                                            className="bg-transparent text-[11px] font-bold text-black/60 outline-none w-14"
                                            min="5"
                                            step="5"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </form>

            <div className="flex-1 pr-1 space-y-2">
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
                    expandedTasks.map((task) => (
                        <TaskRow key={task.id} task={task} toggleTask={toggleTask} deleteTask={deleteTask} editTask={editTask} category={category} />
                    ))
                )}
            </div>
        </div>
    )
}

function TaskRow({ task, toggleTask, deleteTask, editTask, category }: { task: Task, toggleTask: any, deleteTask: any, editTask: any, category: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(task.title)
    const [editAmount, setEditAmount] = useState(task.amount || '')
    const [editPriority, setEditPriority] = useState(task.priority)
    const [editDueDate, setEditDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '')
    const [editEndDate, setEditEndDate] = useState(task.end_date ? task.end_date.split('T')[0] : '')
    const [editDueDateMode, setEditDueDateMode] = useState<'none' | 'on' | 'before' | 'range' | 'recurring'>(task.recurrence_config && task.recurrence_config.type !== 'none' ? 'recurring' : (task.due_date_mode || 'none'))
    const [editRecurrence, setEditRecurrence] = useState<'none' | 'daily' | 'weekdays' | 'weekends' | 'work_days' | 'off_days' | 'weekly' | 'custom'>(task.recurrence_config?.type && task.recurrence_config.type !== 'none' ? task.recurrence_config.type as any : 'off_days')
    const [editRecurringTime, setEditRecurringTime] = useState(task.recurrence_config?.time || '')
    const [editRecurringDuration, setEditRecurringDuration] = useState(task.recurrence_config?.duration_minutes?.toString() || '')

    const handleSave = () => {
        const updates: Partial<Task> = {}
        if (editValue.trim() !== task.title) updates.title = editValue.trim()
        if (editAmount.trim() !== (task.amount || '')) {
            let val = editAmount.trim()
            if (category === 'grocery' && val && !val.startsWith('x')) val = `x${val}`
            updates.amount = val
        }
        if (editPriority !== task.priority) updates.priority = editPriority
        if (editDueDate !== (task.due_date ? task.due_date.split('T')[0] : '')) {
            updates.due_date = editDueDate || undefined
            if (!editDueDate) updates.due_date_mode = 'on'
        }

        if (editEndDate !== (task.end_date ? task.end_date.split('T')[0] : '')) {
            updates.end_date = editEndDate || undefined
        }

        if (editDueDateMode === 'recurring') {
            updates.recurrence_config = { type: editRecurrence, time: editRecurringTime || undefined, duration_minutes: editRecurringDuration ? parseInt(editRecurringDuration) : undefined }
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
                                    {(['daily', 'weekdays', 'weekends', 'work_days', 'off_days', 'weekly', 'custom'] as const).map(rt => (
                                        <button
                                            key={rt}
                                            type="button"
                                            onClick={() => setEditRecurrence(rt)}
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
                                    <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-md px-2 py-1">
                                        <span className="text-[9px] font-bold text-black/40 uppercase">Dur.</span>
                                        <input type="number" placeholder="mins" value={editRecurringDuration} onChange={e => setEditRecurringDuration(e.target.value)} className="bg-transparent text-[10px] font-bold text-black/60 outline-none w-12" min="5" step="5" />
                                    </div>
                                </div>
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

    return (
        <div className={cn(
            "group flex items-center gap-3 p-3 rounded-xl border transition-all relative overflow-hidden",
            task.is_completed
                ? "bg-black/[0.02] border-transparent opacity-60"
                : "bg-white border-black/[0.06] hover:border-black/[0.15] shadow-sm"
        )}>
            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={(e) => toggleTask(task.id, e.target.checked)}
                    className="w-5 h-5 accent-black cursor-pointer shrink-0"
                />
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {category === 'grocery' && task.amount && (
                            <span className="text-[12px] font-bold text-black/40 shrink-0">{task.amount}</span>
                        )}
                        <span className={cn(
                            "text-[14px] transition-all truncate",
                            task.is_completed
                                ? "text-black/30 line-through"
                                : "text-black/90 font-medium"
                        )}>
                            {task.title}
                        </span>
                    </div>
                    {!task.is_completed && task.priority && task.priority !== 'low' && PRIORITY_CONFIG[task.priority] && (
                        <span className={cn(
                            "text-[10px] w-fit px-1.5 py-0.5 rounded uppercase font-bold tracking-wider mt-1 border",
                            PRIORITY_CONFIG[task.priority].color
                        )}>
                            {PRIORITY_CONFIG[task.priority].label} Priority
                        </span>
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
            </label>

            <div className="flex items-center gap-1 shrink-0">
                <button
                    onClick={() => setIsEditing(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition-all"
                    aria-label="Edit task"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => deleteTask(task.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-black/40 hover:text-red-500 hover:bg-red-50 transition-all"
                    aria-label="Delete task"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
