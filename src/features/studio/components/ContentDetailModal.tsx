'use client'

import { useState, useEffect } from 'react'
import { X, Video, Type, Globe, Calendar, Briefcase, AlignLeft, Edit3, Save, Trash2, ExternalLink, Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import type { StudioContent, ContentStatus, Platform, StudioProject } from '../types/studio.types'
import { useStudio } from '../hooks/useStudio'
import PlatformIcon from './PlatformIcon'
import { cn } from '@/lib/utils'

interface ContentDetailModalProps {
    isOpen: boolean
    onClose: () => void
    item: StudioContent | null
}

const PLATFORMS: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'web', 'substack']
const TYPES = ['video', 'reel', 'post', 'thread', 'article', 'short']
const STATUSES: ContentStatus[] = ['idea', 'scripted', 'filmed', 'edited', 'scheduled', 'published']

export default function ContentDetailModal({ isOpen, onClose, item }: ContentDetailModalProps) {
    const { updateContent, deleteContent, projects } = useStudio()
    const [isEditing, setIsEditing] = useState(false)
    const [editedData, setEditedData] = useState<Partial<StudioContent>>({})

    useEffect(() => {
        if (item) {
            setEditedData({})
            setIsEditing(false)
        }
    }, [item])

    if (!isOpen || !item) return null

    const handleSave = async () => {
        if (Object.keys(editedData).length === 0) {
            setIsEditing(false)
            return
        }

        try {
            const submissionData = { ...editedData }
            if ('project_id' in submissionData && !submissionData.project_id) {
                submissionData.project_id = null as any
            }
            await updateContent(item.id, submissionData)
            setIsEditing(false)
        } catch (err: any) {
            alert(`Failed to save changes: ${err.message}`)
        }
    }

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return
        try {
            await deleteContent(item.id)
            onClose()
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`)
        }
    }

    const currentProject = projects.find(p => p.id === (editedData.project_id ?? item.project_id))

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-black/[0.05] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-8 pb-6 flex items-center justify-between border-b border-black/[0.05]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                            <Video className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <PlatformIcon platform={item.platform} className="w-3 h-3 text-black/40" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-black/30">{item.type || 'content'}</span>
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedData.title ?? item.title}
                                    onChange={e => setEditedData(prev => ({ ...prev, title: e.target.value }))}
                                    className="text-xl font-black text-black bg-black/[0.02] border border-black/[0.1] rounded-lg px-2 py-0.5 focus:outline-none focus:border-blue-500 w-full"
                                />
                            ) : (
                                <h2 className="text-xl font-black text-black">{item.title}</h2>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <button
                                onClick={handleSave}
                                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                                title="Save Changes"
                            >
                                <Save className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2.5 bg-black/[0.03] text-black/40 rounded-xl hover:bg-black/[0.05] hover:text-black transition-colors"
                                title="Edit Content"
                            >
                                <Edit3 className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                            <X className="w-6 h-6 text-black/20" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Status & Project Row */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Progress Stage</label>
                            <div className="flex flex-wrap gap-1.5 p-1.5 bg-black/[0.02] rounded-2xl border border-black/[0.05]">
                                {STATUSES.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updateContent(item.id, { status: s })}
                                        className={cn(
                                            "flex-1 px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all",
                                            item.status === s
                                                ? "bg-white text-blue-600 shadow-sm border border-black/[0.05]"
                                                : "text-black/30 hover:text-black hover:bg-black/5"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Linked Project</label>
                            <div className="relative">
                                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <select
                                    disabled={!isEditing}
                                    value={editedData.project_id ?? item.project_id ?? ''}
                                    onChange={e => setEditedData(prev => ({ ...prev, project_id: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3.5 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200 appearance-none disabled:opacity-100"
                                >
                                    <option value="">No project link</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                                {isEditing && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 border-r-2 border-b-2 border-black/20 rotate-45 pointer-events-none" />}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Publish Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input
                                    readOnly={!isEditing}
                                    type="date"
                                    value={editedData.publish_date ?? item.publish_date ?? ''}
                                    onChange={e => setEditedData(prev => ({ ...prev, publish_date: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">External Link</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <div className="flex gap-2">
                                    <input
                                        readOnly={!isEditing}
                                        type="url"
                                        placeholder="Add URL..."
                                        value={editedData.url ?? item.url ?? ''}
                                        onChange={e => setEditedData(prev => ({ ...prev, url: e.target.value }))}
                                        className="flex-1 pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200"
                                    />
                                    {item.url && (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors">
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Notes & Ideas</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-4 top-4 w-4 h-4 text-black/20" />
                            <textarea
                                readOnly={!isEditing}
                                placeholder="Write down your script outline or brainstorm..."
                                value={editedData.notes ?? item.notes ?? ''}
                                onChange={e => setEditedData(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full pl-11 pr-4 py-4 bg-black/[0.02] border border-black/[0.05] rounded-3xl text-[14px] font-medium min-h-[160px] focus:outline-none focus:border-blue-200 resize-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 pt-4 flex items-center justify-between bg-black/[0.01] border-t border-black/[0.05]">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-[12px]"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Item
                    </button>

                    {item.status === 'published' ? (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-[12px] font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            Live on {item.platform}
                        </div>
                    ) : (
                        <div className="text-[11px] font-bold text-black/20 uppercase tracking-widest">
                            In Production
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
