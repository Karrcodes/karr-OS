'use client'

import { useState } from 'react'
import { Plus, X, Video, Type, Globe, Calendar, Briefcase, AlignLeft } from 'lucide-react'
import type { ContentStatus, Platform, StudioContent } from '../types/studio.types'
import { useStudio } from '../hooks/useStudio'
import PlatformIcon from './PlatformIcon'
import { cn } from '@/lib/utils'

interface CreateContentModalProps {
    isOpen: boolean
    onClose: () => void
}

const PLATFORMS: Platform[] = ['youtube', 'instagram', 'tiktok', 'x', 'web', 'substack']
const TYPES = ['video', 'reel', 'post', 'thread', 'article', 'short']

export default function CreateContentModal({ isOpen, onClose }: CreateContentModalProps) {
    const { addContent, projects } = useStudio()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<StudioContent>>({
        title: '',
        platform: 'youtube',
        type: 'video',
        status: 'idea',
        notes: '',
        project_id: ''
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title) return

        try {
            setLoading(true)
            await addContent(formData)
            onClose()
            setFormData({
                title: '',
                platform: 'youtube',
                type: 'video',
                status: 'idea',
                notes: '',
                project_id: ''
            })
        } catch (err: any) {
            console.error('Failed to create content:', err)
            alert(`Error: ${err.message || 'Failed to create content item'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl border border-black/[0.05] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-8 pb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-black flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <Video className="w-5 h-5 text-blue-600" />
                            </div>
                            New Content Item
                        </h2>
                        <p className="text-[13px] text-black/40 font-medium mt-1">Capture a new creative idea for your channels</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-6 h-6 text-black/20" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
                    {/* Title input */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Title</label>
                        <div className="relative">
                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="What are you making?"
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full pl-11 pr-4 py-4 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[16px] font-bold focus:outline-none focus:border-blue-200 transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Platform Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Platform</label>
                            <div className="flex flex-wrap gap-2">
                                {PLATFORMS.map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, platform: p }))}
                                        className={cn(
                                            "p-2 rounded-xl border transition-all flex items-center justify-center",
                                            formData.platform === p
                                                ? "bg-black text-white border-black scale-105 shadow-lg shadow-black/10"
                                                : "bg-black/[0.02] border-black/[0.05] text-black/40 hover:border-black/20"
                                        )}
                                        title={p}
                                    >
                                        <PlatformIcon platform={p} className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Type */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Format</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200"
                            >
                                {TYPES.map(t => (
                                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Linked Project */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Link Project (Optional)</label>
                        <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                            <select
                                value={formData.project_id}
                                onChange={e => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                                className="w-full pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-blue-200 appearance-none"
                            >
                                <option value="">No project link</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4">
                        <button
                            disabled={loading || !formData.title}
                            type="submit"
                            className="w-full py-4 bg-black text-white rounded-2xl font-black text-[14px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 shadow-xl shadow-black/10"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Create Content Item
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
