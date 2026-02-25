'use client'

import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { cn } from '@/lib/utils'
import type { Task } from '../types/tasks.types'
import { Plus, Trash2, GripVertical, CheckCircle2, Circle } from 'lucide-react'

const QUADRANTS = [
    {
        id: 'super',
        title: 'DO FIRST',
        subtitle: 'Urgent & Important',
        description: 'Do it now. Immediate attention required.',
        color: 'bg-blue-50/50',
        borderColor: 'border-blue-200',
        headerColor: 'bg-blue-100/50 text-blue-800',
        priority: 'super' as const,
    },
    {
        id: 'high',
        title: 'SCHEDULE',
        subtitle: 'Not Urgent & Important',
        description: 'Decide when to do it. Focus on these for long-term value.',
        color: 'bg-emerald-50/50',
        borderColor: 'border-emerald-200',
        headerColor: 'bg-emerald-100/50 text-emerald-800',
        priority: 'high' as const,
    },
    {
        id: 'mid',
        title: 'DELEGATE',
        subtitle: 'Urgent & Not Important',
        description: 'Who can do it for you? Push back or automate if possible.',
        color: 'bg-amber-50/50',
        borderColor: 'border-amber-200',
        headerColor: 'bg-amber-100/50 text-amber-800',
        priority: 'mid' as const,
    },
    {
        id: 'low',
        title: 'BACKLOG',
        subtitle: 'Not Urgent & Not Important',
        description: 'Delete it or do it later. Low return on time invested.',
        color: 'bg-neutral-50/50',
        borderColor: 'border-neutral-200',
        headerColor: 'bg-neutral-100/50 text-neutral-800',
        priority: 'low' as const,
    }
]

export function TasksMatrix() {
    const { tasks, toggleTask, editTask, deleteTask } = useTasks('todo')
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
    const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null)

    // Filter out completed tasks for the matrix view
    const pendingTasks = tasks.filter(t => !t.is_completed)

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId)
        // Required for Firefox
        e.dataTransfer.setData('text/plain', taskId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, priority: string) => {
        e.preventDefault() // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move'
        if (dragOverQuadrant !== priority) {
            setDragOverQuadrant(priority)
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        setDragOverQuadrant(null)
    }

    const handleDrop = async (e: React.DragEvent, newPriority: string) => {
        e.preventDefault()
        setDragOverQuadrant(null)

        if (!draggedTaskId) return

        const task = tasks.find(t => t.id === draggedTaskId)
        if (task && task.priority !== newPriority) {
            // Optimistically update or just rely on the hook
            await editTask(draggedTaskId, { priority: newPriority as any })
        }
        setDraggedTaskId(null)
    }

    const handleDragEnd = () => {
        setDraggedTaskId(null)
        setDragOverQuadrant(null)
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-[16px] font-bold text-black tracking-tight">Eisenhower Matrix</h2>
                    <p className="text-[12px] text-black/50">Drag and drop operations to prioritize execution.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {QUADRANTS.map((quadrant) => {
                    const quadrantTasks = pendingTasks.filter(t => (t.priority || 'low') === quadrant.priority)

                    return (
                        <div
                            key={quadrant.id}
                            onDragOver={(e) => handleDragOver(e, quadrant.priority)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, quadrant.priority)}
                            className={cn(
                                "flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden",
                                quadrant.color,
                                quadrant.borderColor,
                                dragOverQuadrant === quadrant.priority ? "scale-[1.02] shadow-lg ring-2 ring-black/10" : "shadow-sm"
                            )}
                        >
                            {/* Quadrant Header */}
                            <div className={cn("px-4 py-3 border-b flex items-center justify-between", quadrant.headerColor, quadrant.borderColor)}>
                                <div>
                                    <h3 className="text-[13px] font-bold uppercase tracking-wider">{quadrant.title}</h3>
                                    <p className="text-[10px] font-medium opacity-80 mt-0.5">{quadrant.subtitle}</p>
                                </div>
                                <div className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/40">
                                    {quadrantTasks.length}
                                </div>
                            </div>

                            {/* Tasks Container */}
                            <div className="flex-1 p-3 overflow-y-auto min-h-[150px] space-y-2">
                                {quadrantTasks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 px-4">
                                        <p className="text-[11px] font-medium leading-tight">{quadrant.description}</p>
                                    </div>
                                ) : (
                                    quadrantTasks.map(task => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            onDragEnd={handleDragEnd}
                                            className={cn(
                                                "group flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-black/5 shadow-sm cursor-grab active:cursor-grabbing hover:border-black/15 transition-all hover:shadow text-left",
                                                draggedTaskId === task.id ? "opacity-40 scale-95" : "opacity-100"
                                            )}
                                        >
                                            <div onClick={(e) => { e.stopPropagation(); toggleTask(task.id, true) }} className="shrink-0 cursor-pointer text-black/20 hover:text-black transition-colors">
                                                <Circle className="w-5 h-5" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-medium text-black truncate">{task.title}</p>
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-black/10 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                                                title="Delete task"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
