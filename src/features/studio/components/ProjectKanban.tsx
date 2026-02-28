'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Shield, Clock, MoreVertical, Trash2 } from 'lucide-react'
import { useStudio } from '../hooks/useStudio'
import type { StudioProject, ProjectStatus } from '../types/studio.types'
import { cn } from '@/lib/utils'
import PlatformIcon from './PlatformIcon'
import ProjectDetailModal from './ProjectDetailModal'

const COLUMNS: { label: string; value: ProjectStatus }[] = [
    { label: 'Idea', value: 'idea' },
    { label: 'Research', value: 'research' },
    { label: 'Active', value: 'active' },
    { label: 'Shipped', value: 'shipped' }
]

export default function ProjectKanban() {
    const { projects, updateProject, deleteProject, loading } = useStudio()
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [selectedProject, setSelectedProject] = useState<StudioProject | null>(null)

    useEffect(() => {
        const handleDelete = async (e: any) => {
            try {
                await deleteProject(e.detail)
            } catch (err: any) {
                alert(`Failed to delete project: ${err.message}`)
            }
        }
        window.addEventListener('studio:deleteProject', handleDelete)
        return () => window.removeEventListener('studio:deleteProject', handleDelete)
    }, [deleteProject])

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const onDrop = async (e: React.DragEvent, status: ProjectStatus) => {
        e.preventDefault()
        if (!draggingId) return

        try {
            await updateProject(draggingId, { status })
        } catch (err) {
            console.error('Failed to update project status:', err)
        } finally {
            setDraggingId(null)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
            {COLUMNS.map(column => {
                const columnProjects = projects.filter(p => p.status === column.value)
                return (
                    <div
                        key={column.value}
                        className="flex flex-col gap-4"
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, column.value)}
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-black/30 flex items-center gap-2">
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    column.value === 'idea' && "bg-black/10",
                                    column.value === 'research' && "bg-blue-400",
                                    column.value === 'active' && "bg-orange-400",
                                    column.value === 'shipped' && "bg-emerald-400"
                                )} />
                                {column.label}
                            </h3>
                            <span className="text-[10px] font-bold text-black/20 bg-black/5 px-1.5 py-0.5 rounded-md">
                                {columnProjects.length}
                            </span>
                        </div>

                        {/* Column Content */}
                        <div className={cn(
                            "flex-1 rounded-[32px] transition-colors p-2 space-y-3 min-h-[150px]",
                            draggingId ? "bg-black/[0.01] border-2 border-dashed border-black/[0.03]" : "bg-transparent"
                        )}>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-40 bg-black/[0.02] border border-black/[0.05] rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : columnProjects.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-center px-4 opacity-10">
                                    <Briefcase className="w-8 h-8 mb-2" />
                                    <p className="text-[11px] font-bold uppercase tracking-widest">Empty</p>
                                </div>
                            ) : (
                                columnProjects.map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onDragStart={() => setDraggingId(project.id)}
                                        onDragEnd={() => setDraggingId(null)}
                                        onClick={() => setSelectedProject(project)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                )
            })}

            <ProjectDetailModal
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                project={selectedProject}
            />
        </div>
    )
}

function ProjectCard({ project, onDragStart, onDragEnd, onClick }: {
    project: StudioProject;
    onDragStart: () => void;
    onDragEnd: () => void;
    onClick: () => void;
}) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className="group relative p-4 bg-white border border-black/[0.05] rounded-2xl cursor-grab active:cursor-grabbing hover:border-orange-200 hover:shadow-xl transition-all"
        >
            <div className="flex justify-between items-start mb-3">
                <div className={cn(
                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight",
                    project.type === 'video' && "bg-red-50 text-red-600",
                    project.type === 'article' && "bg-blue-50 text-blue-600",
                    project.type === 'product' && "bg-emerald-50 text-emerald-600",
                    !project.type && "bg-black/[0.03] text-black/40"
                )}>
                    {project.type || 'other'}
                </div>
                {project.gtv_featured && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded-md">
                        <Shield className="w-3 h-3 text-blue-600" />
                        <span className="text-[8px] font-black text-blue-900 uppercase">GTV</span>
                    </div>
                )}
            </div>

            <h4 className="text-[13px] font-black text-black leading-tight group-hover:text-orange-600 transition-colors">
                {project.title}
            </h4>

            {project.tagline && (
                <p className="text-[11px] text-black/40 mt-1 line-clamp-2 leading-relaxed">
                    {project.tagline}
                </p>
            )}

            <div className="mt-4 pt-3 border-t border-black/[0.03] flex items-center justify-between">
                <div className="flex -space-x-1.5">
                    {project.platforms?.map(p => (
                        <div
                            key={p}
                            className="w-5 h-5 rounded-full bg-white border border-black/[0.08] flex items-center justify-center text-black shadow-sm"
                            title={p}
                        >
                            <PlatformIcon platform={p} className="w-2.5 h-2.5" />
                        </div>
                    ))}
                    {!project.platforms?.length && (
                        <div className="w-5 h-5 rounded-full bg-black/[0.02] border border-black/[0.05] flex items-center justify-center">
                            <Clock className="w-2.5 h-2.5 text-black/20" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
                                window.dispatchEvent(new CustomEvent('studio:deleteProject', { detail: project.id }));
                            }
                        }}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded-md hover:bg-black/5 text-black/20 hover:text-black/60 transition-all">
                        <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Drag Handle Overlay Indicator */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-500 scale-x-0 group-active:scale-x-50 transition-transform rounded-full mx-8" />
        </div>
    )
}
