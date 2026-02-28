'use client'

import { useState, useEffect } from 'react'
import { Video, Film, Edit3, Calendar, CheckCircle2, MoreVertical, Trash2, Plus, ArrowRight, ExternalLink } from 'lucide-react'
import { useStudio } from '../hooks/useStudio'
import type { StudioContent, ContentStatus, StudioProject } from '../types/studio.types'
import { cn } from '@/lib/utils'
import PlatformIcon from './PlatformIcon'
import ContentDetailModal from './ContentDetailModal'
import CreateContentModal from './CreateContentModal'

const CONTENT_COLUMNS: { label: string; value: ContentStatus }[] = [
    { label: 'Idea', value: 'idea' },
    { label: 'Scripted', value: 'scripted' },
    { label: 'Filmed', value: 'filmed' },
    { label: 'Edited', value: 'edited' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Published', value: 'published' }
]

export default function ContentKanban() {
    const { content, projects, updateContent, deleteContent, loading } = useStudio()
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverStatus, setDragOverStatus] = useState<ContentStatus | null>(null)
    const [selectedItem, setSelectedItem] = useState<StudioContent | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const onDragOver = (e: React.DragEvent, status: ContentStatus) => {
        e.preventDefault()
        setDragOverStatus(status)
    }

    const onDrop = async (e: React.DragEvent, status: ContentStatus) => {
        e.preventDefault()
        setDragOverStatus(null)
        if (!draggingId) return

        try {
            await updateContent(draggingId, { status })
        } catch (err) {
            console.error('Failed to update content status:', err)
        } finally {
            setDraggingId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-black flex items-center gap-3">
                        <Video className="w-8 h-8 text-blue-500" />
                        Content Pipeline
                    </h2>
                    <p className="text-[13px] text-black/40 font-medium mt-1">Track your creative output from idea to published</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-black text-white text-[12px] font-black rounded-xl hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Content
                </button>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 no-scrollbar">
                {CONTENT_COLUMNS.map(column => {
                    const columnContent = content.filter(c => c.status === column.value)
                    const isOver = dragOverStatus === column.value

                    return (
                        <div
                            key={column.value}
                            className="flex-shrink-0 w-80 flex flex-col gap-4"
                            onDragOver={(e) => onDragOver(e, column.value)}
                            onDragLeave={() => setDragOverStatus(null)}
                            onDrop={(e) => onDrop(e, column.value)}
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-black/30 flex items-center gap-2">
                                    <div className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        column.value === 'idea' && "bg-black/10",
                                        column.value === 'scripted' && "bg-blue-400",
                                        column.value === 'filmed' && "bg-purple-400",
                                        column.value === 'edited' && "bg-orange-400",
                                        column.value === 'scheduled' && "bg-cyan-400",
                                        column.value === 'published' && "bg-emerald-400"
                                    )} />
                                    {column.label}
                                </h3>
                                <span className="text-[10px] font-bold text-black/20 bg-black/5 px-1.5 py-0.5 rounded-md">
                                    {columnContent.length}
                                </span>
                            </div>

                            {/* Column Content */}
                            <div className={cn(
                                "flex-1 rounded-[32px] transition-all p-2 space-y-3 min-h-[500px] border-2 border-transparent",
                                isOver ? "bg-blue-50/50 border-blue-200 shadow-inner scale-[1.01]" :
                                    draggingId ? "bg-black/[0.01] border-dashed border-black/[0.05]" : "bg-black/[0.02]"
                            )}>
                                {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-32 bg-black/[0.02] border border-black/[0.05] rounded-2xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : columnContent.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-center px-4 opacity-10">
                                        <Video className="w-8 h-8 mb-2" />
                                        <p className="text-[11px] font-bold uppercase tracking-widest">Empty</p>
                                    </div>
                                ) : (
                                    columnContent.map(item => (
                                        <ContentCard
                                            key={item.id}
                                            item={item}
                                            project={projects.find(p => p.id === item.project_id)}
                                            onDragStart={() => setDraggingId(item.id)}
                                            onDragEnd={() => setDraggingId(null)}
                                            onClick={() => setSelectedItem(item)}
                                            onDelete={() => {
                                                if (confirm(`Delete "${item.title}"?`)) {
                                                    deleteContent(item.id)
                                                }
                                            }}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <ContentDetailModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />
            <CreateContentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    )
}

function ContentCard({ item, project, onDragStart, onDragEnd, onClick, onDelete }: {
    item: StudioContent;
    project?: StudioProject;
    onDragStart: () => void;
    onDragEnd: () => void;
    onClick: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className="group relative p-4 bg-white border border-black/[0.05] rounded-2xl cursor-grab active:cursor-grabbing hover:border-blue-200 hover:shadow-xl transition-all"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-1.5">
                    <div className="p-1 px-1.5 rounded-md bg-black/[0.03] flex items-center justify-center">
                        <PlatformIcon platform={item.platform} className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tight text-black/40">
                        {item.type || 'content'}
                    </span>
                </div>
                {item.status === 'published' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                )}
            </div>

            <h4 className="text-[13px] font-black text-black leading-tight group-hover:text-blue-600 transition-colors">
                {item.title}
            </h4>

            {project && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-black/40 bg-black/[0.02] w-fit px-2 py-0.5 rounded-md">
                    <Briefcase className="w-2.5 h-2.5" />
                    {project.title}
                </div>
            )}

            <div className="mt-4 pt-3 border-t border-black/[0.03] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-black/30 font-bold">
                    <Calendar className="w-3 h-3" />
                    {item.publish_date ? new Date(item.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No date'}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded-md hover:bg-black/5 text-black/20 hover:text-black/60 transition-all">
                        <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
import { Briefcase } from 'lucide-react'
