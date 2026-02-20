'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'

interface DraggableSectionProps {
    id: string
    title?: string
    desc?: string
    children: React.ReactNode
    className?: string
}

export function DraggableSection({ id, title, desc, children, className }: DraggableSectionProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative group rounded-2xl bg-white border',
                isDragging ? 'border-[#7c3aed] shadow-lg z-50 opacity-90' : 'border-black/[0.08] shadow-sm',
                className
            )}
        >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1.5 rounded-md hover:bg-black/5 text-black/30 hover:text-black/60 cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                >
                    <GripVertical className="w-4 h-4" />
                </button>
            </div>

            <div className="p-5">
                {(title || desc) && (
                    <div className="flex items-baseline gap-2 mb-4">
                        {title && <h2 className="text-[14px] font-bold text-black">{title}</h2>}
                        {desc && <span className="text-[11px] text-black/35">{desc}</span>}
                    </div>
                )}
                {children}
            </div>
        </div>
    )
}
