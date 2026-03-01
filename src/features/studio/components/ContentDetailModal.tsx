'use client'

import React, { useState, useEffect } from 'react'

import { X, Video, Type, Globe, Calendar, Briefcase, AlignLeft, Edit3, Save, Trash2, ExternalLink, Link as LinkIcon, CheckCircle2, MapPin, Navigation, DollarSign, Plus } from 'lucide-react'
import type { StudioContent, ContentStatus, Platform, StudioProject, ContentCategory, ContentScene, PriorityLevel } from '../types/studio.types'
import { useStudio } from '../hooks/useStudio'
import PlatformIcon from './PlatformIcon'
import { cn } from '@/lib/utils'
import ConfirmationModal from '@/components/ConfirmationModal'

interface ContentDetailModalProps {
    isOpen: boolean
    onClose: () => void
    item: StudioContent | null
}

const PLATFORMS: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'web', 'substack']
const TYPES = ['video', 'reel', 'post', 'thread', 'article', 'short']
const STATUSES: ContentStatus[] = ['idea', 'scripted', 'filmed', 'edited', 'scheduled', 'published']
const CATEGORIES: ContentCategory[] = ['Vlog', 'Thoughts', 'Showcase', 'Concept', 'Update', 'Other']

export default function ContentDetailModal({ isOpen, onClose, item }: ContentDetailModalProps) {
    const { updateContent, deleteContent, projects } = useStudio()
    const [isEditing, setIsEditing] = useState(false)
    const [editedData, setEditedData] = useState<Partial<StudioContent>>({})
    const [newScene, setNewScene] = useState<Partial<ContentScene>>({ type: 'public' })
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    useEffect(() => {
        if (item) {
            setEditedData({})
            setIsEditing(false)
        }
    }, [item])

    if (!isOpen || !item) return null

    const togglePlatform = (p: Platform) => {
        const currentPlatforms = editedData.platforms ?? item.platforms ?? []
        const newPlatforms = currentPlatforms.includes(p)
            ? currentPlatforms.filter((x: Platform) => x !== p)
            : [...currentPlatforms, p]
        setEditedData((prev: Partial<StudioContent>) => ({ ...prev, platforms: newPlatforms }))
    }

    const addScene = () => {
        if (!newScene.location) return
        const scene: ContentScene = {
            id: Math.random().toString(36).substring(2, 11),
            location: newScene.location,
            type: newScene.type as any,
            cost: newScene.cost,
            distance: newScene.distance
        }
        const currentScenes = editedData.scenes ?? item.scenes ?? []
        setEditedData((prev: Partial<StudioContent>) => ({ ...prev, scenes: [...currentScenes, scene] }))
        setNewScene({ type: 'public' })
    }

    const removeScene = (id: string) => {
        const currentScenes = editedData.scenes ?? item.scenes ?? []
        setEditedData((prev: Partial<StudioContent>) => ({ ...prev, scenes: currentScenes.filter((s: ContentScene) => s.id !== id) }))
    }

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

            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-black/[0.05] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] font-outfit">
                {/* Header */}
                <div className="p-8 pb-6 flex items-center justify-between border-b border-black/[0.05]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                            <Video className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="flex items-center gap-1">
                                    {(editedData.platforms ?? item.platforms ?? []).map((p: Platform) => (
                                        <PlatformIcon key={p} platform={p} className="w-3 h-3 text-black/40" />
                                    ))}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-black/30">
                                    {editedData.category ?? item.category ?? 'Content'} • {editedData.type ?? item.type}
                                </span>
                            </div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedData.title ?? item.title}
                                    onChange={e => setEditedData((prev: Partial<StudioContent>) => ({ ...prev, title: e.target.value }))}
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
                                    onChange={e => setEditedData((prev: Partial<StudioContent>) => ({ ...prev, project_id: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3.5 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200 appearance-none disabled:opacity-100 cursor-pointer"
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

                    {/* Meta Selectors (Priority, Impact, Category, Format) */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Priority</label>
                                <select
                                    disabled={!isEditing}
                                    value={editedData.priority ?? item.priority ?? 'mid'}
                                    onChange={e => setEditedData((prev: Partial<StudioContent>) => ({ ...prev, priority: e.target.value as any }))}
                                    className="w-full px-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200 appearance-none disabled:opacity-100 cursor-pointer"
                                >
                                    <option value="urgent">Urgent</option>
                                    <option value="high">High</option>
                                    <option value="mid">Mid</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Impact</label>
                                <select
                                    disabled={!isEditing}
                                    value={editedData.impact ?? item.impact ?? 'mid'}
                                    onChange={e => setEditedData((prev: Partial<StudioContent>) => ({ ...prev, impact: e.target.value as any }))}
                                    className="w-full px-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200 appearance-none disabled:opacity-100 cursor-pointer"
                                >
                                    <option value="urgent">Urgent</option>
                                    <option value="high">High</option>
                                    <option value="mid">Mid</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Category</label>
                                <select
                                    disabled={!isEditing}
                                    value={editedData.category ?? item.category ?? 'Vlog'}
                                    onChange={e => setEditedData((prev: Partial<StudioContent>) => ({ ...prev, category: e.target.value as any }))}
                                    className="w-full px-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200 appearance-none disabled:opacity-100 cursor-pointer"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Format</label>
                                <select
                                    disabled={!isEditing}
                                    value={editedData.type ?? item.type}
                                    onChange={e => setEditedData((prev: Partial<StudioContent>) => ({ ...prev, type: e.target.value }))}
                                    className="w-full px-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200 appearance-none disabled:opacity-100 cursor-pointer"
                                >
                                    {TYPES.map(t => (
                                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Platforms (Distribute To) */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Distribute To</label>
                        <div className="flex flex-wrap gap-2 px-2">
                            {PLATFORMS.map(p => (
                                <button
                                    key={p}
                                    disabled={!isEditing}
                                    type="button"
                                    onClick={() => togglePlatform(p)}
                                    className={cn(
                                        "w-8 h-8 rounded-xl border transition-all flex items-center justify-center",
                                        (editedData.platforms ?? item.platforms ?? []).includes(p)
                                            ? "bg-black text-white border-black scale-110 shadow-lg shadow-black/10"
                                            : "bg-black/[0.02] border-black/[0.05] text-black/40 hover:border-black/20",
                                        !isEditing && "cursor-default"
                                    )}
                                    title={p}
                                >
                                    <PlatformIcon platform={p} className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Metadata Grid (Date & Link) */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Publish Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input
                                    readOnly={!isEditing}
                                    type="date"
                                    value={editedData.publish_date ?? item.publish_date ?? ''}
                                    onChange={e => setEditedData((prev: Partial<StudioContent>) => ({ ...prev, publish_date: e.target.value }))}
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
                                        onChange={e => setEditedData((prev: Partial<StudioContent>) => ({ ...prev, url: e.target.value }))}
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
                                onChange={e => setEditedData((prev: Partial<StudioContent>) => ({ ...prev, notes: e.target.value }))}
                                className="w-full pl-11 pr-4 py-4 bg-black/[0.02] border border-black/[0.05] rounded-3xl text-[14px] font-medium min-h-[160px] focus:outline-none focus:border-blue-200 resize-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Scenes Section */}
                    <div className="space-y-4 pt-4 border-t border-black/[0.05]">
                        <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30">Production Scenes</label>
                            {isEditing && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-black/[0.02] border border-black/[0.05] rounded-xl p-1">
                                        <input
                                            placeholder="Location"
                                            value={newScene.location || ''}
                                            onChange={e => setNewScene(prev => ({ ...prev, location: e.target.value }))}
                                            className="text-[11px] font-bold px-2 py-1 bg-transparent focus:outline-none w-24"
                                        />
                                        <select
                                            value={newScene.type || 'public'}
                                            onChange={e => setNewScene(prev => ({ ...prev, type: e.target.value as any }))}
                                            className="text-[10px] font-bold bg-transparent border-l border-black/[0.05] px-1 focus:outline-none"
                                        >
                                            <option value="public">Pub</option>
                                            <option value="private">Priv</option>
                                        </select>
                                        <input
                                            placeholder="Cost"
                                            value={newScene.cost || ''}
                                            onChange={e => setNewScene(prev => ({ ...prev, cost: e.target.value }))}
                                            className="text-[11px] font-bold px-2 py-1 bg-transparent border-l border-black/[0.05] focus:outline-none w-16"
                                        />
                                        <input
                                            placeholder="Dist"
                                            value={newScene.distance || ''}
                                            onChange={e => setNewScene(prev => ({ ...prev, distance: e.target.value }))}
                                            className="text-[11px] font-bold px-2 py-1 bg-transparent border-l border-black/[0.05] focus:outline-none w-16"
                                        />
                                    </div>
                                    <button onClick={addScene} className="p-1.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-black/[0.05] bg-black/[0.01]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/[0.02] border-b border-black/[0.05]">
                                        <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-black/30">Location</th>
                                        <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-black/30">Type</th>
                                        <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-black/30">Cost</th>
                                        <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-black/30">Dist.</th>
                                        {isEditing && <th className="px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-black/30 text-right"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/[0.03]">
                                    {(editedData.scenes ?? item.scenes ?? []).map((scene: ContentScene) => (
                                        <tr key={scene.id} className="group hover:bg-black/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-[12px] font-bold text-black">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3 h-3 text-black/20" />
                                                    {scene.location}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border",
                                                    scene.type === 'private' ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                )}>
                                                    {scene.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-black/50">
                                                    <DollarSign className="w-3 h-3" />
                                                    {scene.cost || 'Free'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-black/50">
                                                    <Navigation className="w-3 h-3" />
                                                    {scene.distance || '-'}
                                                </div>
                                            </td>
                                            {isEditing && (
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => removeScene(scene.id)} className="p-1.5 text-black/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {(editedData.scenes ?? item.scenes ?? []).length === 0 && (
                                        <tr>
                                            <td colSpan={isEditing ? 5 : 4} className="px-4 py-10 text-center">
                                                <p className="text-[11px] font-bold text-black/20 uppercase tracking-widest italic">No production scenes listed</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 pt-4 flex items-center justify-between bg-black/[0.01] border-t border-black/[0.05]">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold text-[12px]"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Item
                    </button>

                    {item.status === 'published' ? (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-[12px] font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            Live on {(item.platforms ?? []).join(', ')}
                        </div>
                    ) : (
                        <div className="text-[11px] font-bold text-black/20 uppercase tracking-widest">
                            In Production
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Content"
                message={`Are you sure you want to delete "${item.title}"? This action cannot be undone.`}
                confirmText="Delete"
                type="danger"
            />
        </div>
    )
}
