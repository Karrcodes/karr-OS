'use client'

import { useState } from 'react'
import { CheckSquare, ShoppingCart, Bell, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { cn } from '@/lib/utils'
import type { Task } from '../types/tasks.types'

const PRIORITY_CONFIG = {
    super: { label: 'Super', color: 'bg-blue-50 text-blue-600 border-blue-200', sort: 0 },
    high: { label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-200', sort: 1 },
    mid: { label: 'Mid', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', sort: 2 },
    low: { label: 'Low', color: 'bg-black/5 text-black/60 border-black/10', sort: 3 }
} as const

export function TaskList({ category, title, icon: Icon }: { category: 'todo' | 'grocery' | 'reminder', title: string, icon: any }) {
    const { tasks, loading, createTask, toggleTask, deleteTask, clearAllTasks } = useTasks(category)
    const [newTask, setNewTask] = useState('')
    const [priority, setPriority] = useState<'super' | 'high' | 'mid' | 'low'>('low')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return

        try {
            await createTask(newTask.trim(), priority)
            setNewTask('')
            setPriority('low')
        } catch (err: any) {
            console.error('Task creation failed:', err)
            alert(err.message || 'Failed to create task. Please check your connection.')
        }
    }

    const handleClearAll = async () => {
        if (window.confirm(`Are you sure you want to clear all items? This cannot be undone.`)) {
            await clearAllTasks()
        }
    }

    // Sort: Uncompleted first (sorted by priority), Completed last.
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.is_completed !== b.is_completed) {
            return a.is_completed ? 1 : -1
        }
        if (!a.is_completed && !b.is_completed && category === 'todo') {
            const aPriority = a.priority || 'low'
            const bPriority = b.priority || 'low'
            const aSort = PRIORITY_CONFIG[aPriority]?.sort ?? 3
            const bSort = PRIORITY_CONFIG[bPriority]?.sort ?? 3
            return aSort - bSort
        }
        // Default to newest first
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })

    return (
        <div className="bg-white rounded-xl border border-black/[0.08] p-5 shadow-sm flex flex-col min-h-[500px]">
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
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder={`Add new ${category === 'todo' ? 'task' : 'item'}...`}
                        className="flex-1 bg-black/[0.03] border border-black/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-black placeholder-black/30 outline-none focus:border-black/40 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newTask.trim() || loading}
                        className="w-11 h-11 rounded-xl bg-black flex items-center justify-center text-white hover:bg-neutral-800 transition-colors shrink-0 disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                {category === 'todo' && newTask.trim().length > 0 && (
                    <div className="flex gap-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                        {(['super', 'high', 'mid', 'low'] as const).map(p => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors",
                                    priority === p ? PRIORITY_CONFIG[p].color : "bg-transparent text-black/40 border-black/10 hover:bg-black/5"
                                )}
                            >
                                {PRIORITY_CONFIG[p].label}
                            </button>
                        ))}
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
                    sortedTasks.map((task) => (
                        <TaskRow key={task.id} task={task} toggleTask={toggleTask} deleteTask={deleteTask} category={category} />
                    ))
                )}
            </div>
        </div>
    )
}

function TaskRow({ task, toggleTask, deleteTask, category }: { task: Task, toggleTask: any, deleteTask: any, category: string }) {
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
                    <span className={cn(
                        "text-[14px] transition-all truncate",
                        task.is_completed
                            ? "text-black/30 line-through"
                            : "text-black/90 font-medium"
                    )}>
                        {task.title}
                    </span>
                    {category === 'todo' && !task.is_completed && task.priority && task.priority !== 'low' && PRIORITY_CONFIG[task.priority] && (
                        <span className={cn(
                            "text-[10px] w-fit px-1.5 py-0.5 rounded uppercase font-bold tracking-wider mt-1 border",
                            PRIORITY_CONFIG[task.priority].color
                        )}>
                            {PRIORITY_CONFIG[task.priority].label} Priority
                        </span>
                    )}
                </div>
            </label>

            <button
                onClick={() => deleteTask(task.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-black/10 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete task"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )
}
