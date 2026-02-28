'use client'

import { useState } from 'react'
import { Plus, X, Briefcase, Globe, Type, AlignLeft, Youtube, Instagram } from 'lucide-react'
import type { ProjectStatus, ProjectType, Platform } from '../types/studio.types'
import { useStudio } from '../hooks/useStudio'
import PlatformIcon from './PlatformIcon'

interface CreateProjectModalProps {
    isOpen: boolean
    onClose: () => void
}

const PROJECT_TYPES: ProjectType[] = ['article', 'video', 'product', 'event', 'open_source', 'other']
const PLATFORMS: Platform[] = ['youtube', 'instagram', 'substack', 'tiktok', 'x', 'web']

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
    const { addProject } = useStudio()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        tagline: '',
        description: '',
        type: 'article' as ProjectType,
        platforms: [] as Platform[],
        status: 'idea' as ProjectStatus,
        gtv_featured: false
    })

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title) return

        try {
            setLoading(true)
            await addProject(formData)
            onClose()
            setFormData({
                title: '',
                tagline: '',
                description: '',
                type: 'article',
                platforms: [],
                status: 'idea',
                gtv_featured: false
            })
        } catch (err) {
            console.error('Failed to create project:', err)
        } finally {
            setLoading(false)
        }
    }

    const togglePlatform = (p: Platform) => {
        setFormData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(p)
                ? prev.platforms.filter(x => x !== p)
                : [...prev.platforms, p]
        }))
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                                <Plus className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-black leading-tight">New Project</h2>
                                <p className="text-[12px] font-medium text-black/40">Add a new creative endeavor to your pipeline.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 text-black/20 hover:text-black/60 transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title & Tagline */}
                        <div className="space-y-4">
                            <div className="relative">
                                <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    placeholder="Project Title"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-200 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input
                                    type="text"
                                    placeholder="One-line Tagline"
                                    value={formData.tagline}
                                    onChange={e => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-medium focus:outline-none focus:border-orange-200 transition-all"
                                />
                            </div>
                        </div>

                        {/* Type & Platforms */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Project Type</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as ProjectType }))}
                                    className="w-full px-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-orange-200 transition-all appearance-none cursor-pointer"
                                >
                                    {PROJECT_TYPES.map(t => (
                                        <option key={t} value={t}>{t.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Primary Target</label>
                                <div className="flex flex-wrap gap-1.5 px-2">
                                    {PLATFORMS.map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => togglePlatform(p)}
                                            className={cn(
                                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                                formData.platforms.includes(p)
                                                    ? "bg-black text-white scale-110"
                                                    : "bg-black/[0.04] text-black/30 hover:bg-black/[0.08]"
                                            )}
                                            title={p.charAt(0).toUpperCase() + p.slice(1)}
                                        >
                                            <PlatformIcon platform={p} className="w-3 h-3 text-black/60 group-hover:text-orange-600 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Brief / Description</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-medium focus:outline-none focus:border-orange-200 transition-all resize-none"
                                placeholder="What is this project about?"
                            />
                        </div>

                        {/* GTV Toggle */}
                        <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Shield className={cn("w-5 h-5", formData.gtv_featured ? "text-blue-600" : "text-blue-200")} />
                                <div>
                                    <p className="text-[12px] font-bold text-blue-900 leading-none">Feature in GTV Portfolio?</p>
                                    <p className="text-[10px] text-blue-800/60 mt-0.5">Will be highlighted on your Portfolio page.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, gtv_featured: !prev.gtv_featured }))}
                                className={cn(
                                    "w-10 h-5 rounded-full relative transition-colors duration-200",
                                    formData.gtv_featured ? "bg-blue-600" : "bg-black/10"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-200 ease-in-out",
                                    formData.gtv_featured ? "right-1" : "left-1"
                                )} />
                            </button>
                        </div>

                        <button
                            disabled={loading || !formData.title}
                            type="submit"
                            className="w-full py-4 bg-black text-white rounded-2xl text-[14px] font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Create Project
                                    <Briefcase className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

function Shield(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
