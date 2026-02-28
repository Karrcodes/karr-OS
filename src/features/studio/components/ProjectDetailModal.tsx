'use client'

import { useState } from 'react'
import {
    X,
    Calendar,
    Shield,
    Target,
    Plus,
    CheckCircle2,
    Circle,
    Trash2,
    ExternalLink,
    ChevronRight,
    Briefcase,
    Type,
    AlignLeft,
    Image as ImageIcon,
    UploadCloud,
    Rocket
} from 'lucide-react'
import { useStudio } from '../hooks/useStudio'
import { useGoals } from '../../goals/hooks/useGoals'
import type { StudioProject, StudioMilestone } from '../types/studio.types'
import { cn } from '@/lib/utils'
import PlatformIcon from './PlatformIcon'

interface ProjectDetailModalProps {
    isOpen: boolean
    onClose: () => void
    project: StudioProject | null
}

export default function ProjectDetailModal({ isOpen, onClose, project }: ProjectDetailModalProps) {
    const { milestones, addMilestone, updateMilestone, deleteMilestone, updateProject, loading } = useStudio()
    const [isEditing, setIsEditing] = useState(false)
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
    const [editedData, setEditedData] = useState<Partial<StudioProject>>({})
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const { createGoal } = useGoals()

    if (!isOpen || !project) return null

    const projectMilestones = milestones.filter(m => m.project_id === project.id)
    const completedCount = projectMilestones.filter(m => m.status === 'completed').length
    const progress = projectMilestones.length > 0 ? (completedCount / projectMilestones.length) * 100 : 0

    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMilestoneTitle.trim()) return

        try {
            await addMilestone({
                project_id: project.id,
                title: newMilestoneTitle.trim(),
                status: 'pending',
                target_date: (document.getElementById('new-milestone-date') as HTMLInputElement)?.value || undefined
            })
            setNewMilestoneTitle('')
            if (document.getElementById('new-milestone-date')) {
                (document.getElementById('new-milestone-date') as HTMLInputElement).value = '';
            }
        } catch (err: any) {
            alert(`Failed to add milestone: ${err.message}`)
        }
    }

    const toggleMilestone = async (milestone: StudioMilestone) => {
        try {
            await updateMilestone(milestone.id, {
                status: milestone.status === 'completed' ? 'pending' : 'completed',
                completed_at: milestone.status === 'pending' ? new Date().toISOString() : undefined
            })
        } catch (err: any) {
            alert(`Failed to update milestone: ${err.message}`)
        }
    }

    const handleSaveMetadata = async () => {
        if (Object.keys(editedData).length === 0) {
            setIsEditing(false)
            return
        }

        try {
            await updateProject(project.id, editedData, coverFile || undefined)
            setIsEditing(false)
            setEditedData({})
            setCoverFile(null)
        } catch (err: any) {
            alert(`Failed to save changes: ${err.message}`)
        }
    }

    const handlePromote = async () => {
        if (!confirm('This will convert this Studio Project into a formal Business Goal in the Operations module. Continue?')) return

        try {
            await createGoal({
                title: project.title,
                description: project.description || '',
                category: 'personal', // Default to personal or mapping?
                status: 'active',
                vision_image_url: project.cover_url,
                milestones: projectMilestones.map(m => ({
                    title: m.title,
                    is_completed: m.status === 'completed'
                }))
            })

            // Optionally mark project as archived or delete? 
            // For now let's just show success
            alert('Project successfully promoted to Operations!')
            onClose()
        } catch (err: any) {
            alert(`Promotion failed: ${err.message}`)
        }
    }

    const handleEditToggle = () => {
        if (!isEditing) {
            setEditedData({
                title: project.title,
                tagline: project.tagline,
                description: project.description,
                cover_url: project.cover_url,
                target_date: project.target_date
            })
        }
        setIsEditing(!isEditing)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Visual Header / Cover */}
                {project.cover_url && !isEditing && (
                    <div className="h-48 w-full overflow-hidden shrink-0">
                        <img
                            src={project.cover_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent h-48 mt-[104px]" />
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-black/[0.05]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-black leading-none">Project Details</h2>
                            <p className="text-[11px] text-black/40 font-bold uppercase tracking-widest mt-1">Pipeline ID: {project.id.slice(0, 8)}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-black/5 text-black/20 hover:text-black transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Basic Info */}
                    <section className="space-y-4">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                                <div className="space-y-1">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Project Title</label>
                                                <input
                                                    type="text"
                                                    value={editedData.title ?? project.title}
                                                    onChange={(e) => setEditedData(prev => ({ ...prev, title: e.target.value }))}
                                                    className="w-full text-3xl font-black text-black tracking-tight bg-black/[0.02] border border-black/[0.1] rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500 transition-all font-outfit"
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Project Status</label>
                                                        <div className="flex items-center h-[46px] px-4 bg-black/[0.02] border border-black/[0.1] rounded-xl">
                                                            <div className={cn(
                                                                "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight",
                                                                project.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                                            )}>
                                                                {project.status}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Project Type</label>
                                                        <div className="flex items-center h-[46px] px-4 bg-black/[0.02] border border-black/[0.1] rounded-xl text-[11px] font-bold text-black/60 capitalize">
                                                            {project.type?.replace('_', ' ') || 'Other'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Target Date</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                                        <input
                                                            type="date"
                                                            value={editedData.target_date ?? project.target_date ?? ''}
                                                            onChange={(e) => setEditedData(prev => ({ ...prev, target_date: e.target.value }))}
                                                            className="w-full pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.1] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-orange-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <h1 className="text-3xl font-black text-black tracking-tight">{project.title}</h1>
                                                <div className={cn(
                                                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight",
                                                    project.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                                )}>
                                                    {project.status}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="space-y-4 pt-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Tagline</label>
                                            <input
                                                type="text"
                                                value={editedData.tagline ?? project.tagline ?? ''}
                                                onChange={(e) => setEditedData(prev => ({ ...prev, tagline: e.target.value }))}
                                                className="w-full text-lg text-black/40 font-medium bg-black/[0.02] border border-black/[0.1] rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500"
                                                placeholder="Add a catchy tagline..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Cover Asset</label>
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                                    <input
                                                        type="url"
                                                        value={editedData.cover_url ?? project.cover_url ?? ''}
                                                        onChange={(e) => setEditedData(prev => ({ ...prev, cover_url: e.target.value }))}
                                                        className="w-full pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.1] rounded-xl text-[12px] font-bold focus:outline-none focus:border-orange-500"
                                                        placeholder="Cover Image URL..."
                                                    />
                                                </div>
                                                <label className="cursor-pointer group/upload relative">
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={e => setCoverFile(e.target.files?.[0] || null)}
                                                    />
                                                    <div className={cn(
                                                        "h-full px-5 rounded-xl border-2 border-dashed flex items-center justify-center transition-all",
                                                        coverFile ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-inner" : "bg-black/[0.02] border-black/[0.1] hover:border-orange-200 hover:bg-orange-50/5"
                                                    )}>
                                                        <UploadCloud className="w-5 h-5" />
                                                        {coverFile && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />}
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <p className="text-lg text-black/40 font-medium">{project.tagline || 'No tagline set'}</p>
                                        {project.target_date && (
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-black/30">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Due {new Date(project.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!isEditing && (
                                <div className="flex gap-2 justify-end -mt-12 mb-4 relative z-10">
                                    <button
                                        onClick={handlePromote}
                                        className="px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-100 hover:scale-105 transition-all flex items-center gap-2 shadow-sm"
                                        title="Promote to Operations (Goal)"
                                    >
                                        <Rocket className="w-4 h-4" />
                                        Promote
                                    </button>
                                    <button
                                        onClick={handleEditToggle}
                                        className="px-4 py-2 rounded-xl border border-black/[0.05] bg-white text-[11px] font-black uppercase tracking-widest hover:bg-black/[0.02] hover:scale-105 transition-all shadow-sm"
                                    >
                                        Edit Project
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Platforms & GTV */}
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/[0.02] border border-black/[0.04] rounded-xl">
                                <Target className="w-3.5 h-3.5 text-black/40" />
                                <div className="flex items-center gap-1 ml-1">
                                    {project.platforms?.map(p => (
                                        <PlatformIcon key={p} platform={p} className="w-3.5 h-3.5 text-black/60" />
                                    ))}
                                    {!project.platforms?.length && <span className="text-[11px] font-bold text-black/20 italic">No targets</span>}
                                </div>
                            </div>
                            {project.gtv_featured && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl">
                                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-[11px] font-black text-blue-900 uppercase">GTV Portfolio Evidence</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Milestones / Roadmap */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[13px] font-black text-black uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Project Roadmap
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-32 bg-black/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span className="text-[11px] font-bold text-black/40">{Math.round(progress)}%</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {projectMilestones.map(m => (
                                <div
                                    key={m.id}
                                    className="p-4 bg-white border border-black/[0.05] rounded-2xl flex items-center justify-between group hover:border-emerald-200 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleMilestone(m)}
                                            className={cn(
                                                "transition-colors",
                                                m.status === 'completed' ? "text-emerald-500" : "text-black/10 hover:text-emerald-500"
                                            )}
                                        >
                                            {m.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                        </button>
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-[14px] font-bold transition-all",
                                                m.status === 'completed' ? "text-black/30 line-through" : "text-black"
                                            )}>
                                                {m.title}
                                            </span>
                                            {m.target_date && (
                                                <span className="text-[10px] font-bold text-black/20 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(m.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteMilestone(m.id)}
                                        className="p-2 opacity-0 group-hover:opacity-100 text-black/10 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <form onSubmit={handleAddMilestone} className="relative mt-4">
                                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input
                                    type="text"
                                    value={newMilestoneTitle}
                                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                                    placeholder="Add a milestone to the roadmap..."
                                    className="w-full pl-11 pr-32 py-3.5 bg-black/[0.01] border-2 border-dashed border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-emerald-200 focus:bg-emerald-50/10 transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <input
                                        type="date"
                                        className="bg-transparent border-none text-[11px] font-bold text-black/40 focus:outline-none"
                                        title="Target Date"
                                        id="new-milestone-date"
                                    />
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* Description */}
                    <section className="space-y-4">
                        <h3 className="text-[13px] font-black text-black uppercase tracking-wider flex items-center gap-2">
                            <AlignLeft className="w-4 h-4 text-blue-500" />
                            Project Brief
                        </h3>
                        {isEditing ? (
                            <textarea
                                value={editedData.description ?? project.description ?? ''}
                                onChange={(e) => setEditedData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full p-4 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-medium min-h-[150px] focus:outline-none focus:border-blue-200"
                                placeholder="Write the project vision, goals, and core features..."
                            />
                        ) : (
                            <div className="p-6 bg-black/[0.02] border border-black/[0.03] rounded-3xl min-h-[100px]">
                                {project.description ? (
                                    <p className="text-[14px] text-black/70 leading-relaxed whitespace-pre-wrap">
                                        {project.description}
                                    </p>
                                ) : (
                                    <p className="text-[13px] text-black/20 italic font-medium">No description provided yet.</p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Action Footer (if editing) */}
                    {isEditing && (
                        <div className="flex gap-3 justify-end pt-4 border-t border-black/[0.05]">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 rounded-xl text-[12px] font-black text-black/40 hover:bg-black/5 transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSaveMetadata}
                                className="px-8 py-2.5 bg-black text-white rounded-xl text-[12px] font-black hover:scale-105 transition-transform shadow-lg shadow-black/10"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
