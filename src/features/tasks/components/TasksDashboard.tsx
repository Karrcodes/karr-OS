'use client'

import { useState, useRef } from 'react'
import { CheckSquare, ShoppingCart, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { cn } from '@/lib/utils'
import type { Task } from '../types/tasks.types'

const PRIORITY_CONFIG = {
    super: { label: 'Super', color: 'bg-red-50 text-red-600 border-red-200', sort: 0 },
    high: { label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-200', sort: 1 },
    mid: { label: 'Mid', color: 'bg-yellow-50 text-yellow-600 border-yellow-200', sort: 2 },
    low: { label: 'Low', color: 'bg-black/5 text-black/60 border-black/10', sort: 3 }
} as const

function TaskList({ category, title, icon: Icon }: { category: 'todo' | 'grocery', title: string, icon: any }) {
    const { tasks, loading, createTask, toggleTask, deleteTask, clearAllTasks } = useTasks(category)
    const [newTask, setNewTask] = useState('')
    const [priority, setPriority] = useState<'super' | 'high' | 'mid' | 'low'>('low')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return
        await createTask(newTask.trim(), priority)
        setNewTask('')
        setPriority('low')
    }

    const handleClearAll = async () => {
        if (window.confirm(`Are you sure you want to clear all ${category === 'todo' ? 'action items' : 'groceries'}? This cannot be undone.`)) {
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
        <div className="bg-white rounded-xl border border-black/[0.08] p-5 shadow-sm flex flex-col h-fit">
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
    const [slideOffset, setSlideOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const startX = useRef<number | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX
        setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX.current === null) return
        const delta = e.touches[0].clientX - startX.current
        // Only allow sliding left (negative delta), cap at -60px
        if (delta < 0) {
            setSlideOffset(Math.max(-80, delta))
        } else {
            setSlideOffset(0)
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        if (slideOffset < -50) {
            // Commit to delete if dragged far enough
            // Instead of auto-delete, we just lock the menu open
            setSlideOffset(-60)
        } else {
            // Snap back
            setSlideOffset(0)
        }
        startX.current = null
    }

    return (
        <div className={cn(
            "relative rounded-lg transition-all overflow-hidden bg-red-500",
            task.is_completed ? "opacity-60" : ""
        )}>
            {/* Background Delete Action - Revealed behind the sliding row */}
            <div className="absolute inset-y-0 right-0 w-[60px] flex items-center justify-center">
                <button
                    onClick={() => deleteTask(task.id)}
                    className="w-full h-full flex flex-col items-center justify-center text-white"
                >
                    <Trash2 className="w-4 h-4 mb-0.5" />
                </button>
            </div>

            {/* Draggable Foreground Row */}
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: `translateX(${slideOffset}px)` }}
                className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all z-10 relative shadow-sm h-full group",
                    !isDragging && "transition-transform duration-200",
                    task.is_completed
                        ? "bg-black/[0.02] border-transparent shadow-none"
                        : "bg-white border-black/[0.06] hover:border-black/[0.15]"
                )}
            >
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                        type="checkbox"
                        checked={task.is_completed}
                        onChange={(e) => {
                            setSlideOffset(0); // reset slide menu if opened
                            toggleTask(task.id, e.target.checked);
                        }}
                        className="w-5 h-5 accent-black cursor-pointer shrink-0"
                    />
                    <div className="flex flex-col flex-1">
                        <span className={cn(
                            "text-[14px] transition-all",
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

                {/* Desktop Hover Delete (Hidden on Mobile Touch) */}
                <button
                    onClick={() => deleteTask(task.id)}
                    className="w-8 h-8 hidden md:flex items-center justify-center rounded-lg text-black/20 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

export function TasksDashboard() {
    return (
        <div className="flex flex-col h-full bg-[#fafafa]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-white flex-shrink-0 z-10">
                <div>
                    <h1 className="text-[22px] font-bold text-black tracking-tight">Focus & Execution</h1>
                    <p className="text-[12px] text-black/40 mt-0.5">Manage tasks and groceries sync'd across your devices.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    <TaskList category="todo" title="Action Items" icon={CheckSquare} />
                    <TaskList category="grocery" title="Grocery List" icon={ShoppingCart} />
                </div>
            </div>
        </div>
    )
}
