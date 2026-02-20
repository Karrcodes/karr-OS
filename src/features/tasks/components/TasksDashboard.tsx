'use client'

import { useState } from 'react'
import { CheckSquare, ShoppingCart, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { cn } from '@/lib/utils'

function TaskList({ category, title, icon: Icon }: { category: 'todo' | 'grocery', title: string, icon: any }) {
    const { tasks, loading, createTask, toggleTask, deleteTask } = useTasks(category)
    const [newTask, setNewTask] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTask.trim()) return
        await createTask(newTask.trim())
        setNewTask('')
    }

    return (
        <div className="bg-white rounded-xl border border-black/[0.08] p-5 shadow-sm flex flex-col h-fit">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-black/5 border border-black/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-black" />
                </div>
                <div>
                    <h2 className="text-[16px] font-bold text-black tracking-tight">{title}</h2>
                    <p className="text-[12px] text-black/50">{tasks.filter(t => !t.is_completed).length} pending</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="mb-5 flex gap-2">
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
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-all group",
                                task.is_completed
                                    ? "bg-black/[0.02] border-transparent"
                                    : "bg-white border-black/[0.06] hover:border-black/[0.15]"
                            )}
                        >
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <input
                                    type="checkbox"
                                    checked={task.is_completed}
                                    onChange={(e) => toggleTask(task.id, e.target.checked)}
                                    className="w-5 h-5 accent-black cursor-pointer shrink-0"
                                />
                                <span className={cn(
                                    "text-[14px] transition-all",
                                    task.is_completed
                                        ? "text-black/30 line-through"
                                        : "text-black/90 font-medium"
                                )}>
                                    {task.title}
                                </span>
                            </label>

                            <button
                                onClick={() => deleteTask(task.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-black/20 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
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

            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    <TaskList category="todo" title="Action Items" icon={CheckSquare} />
                    <TaskList category="grocery" title="Grocery List" icon={ShoppingCart} />
                </div>
            </div>
        </div>
    )
}
