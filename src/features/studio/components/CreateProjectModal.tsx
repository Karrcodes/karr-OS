'use client'

import React, { useState } from 'react'
import { Plus, X, Briefcase, Globe, Type, AlignLeft, Youtube, Instagram, UploadCloud, Trash2, CheckSquare, Calendar } from 'lucide-react'
import type { ProjectStatus, ProjectType, Platform } from '../types/studio.types'
import { useStudio } from '../hooks/useStudio'
import PlatformIcon from './PlatformIcon'

interface CreateProjectModalProps {
    isOpen: boolean
    onClose: () => void
}

const PROJECT_TYPES: ProjectType[] = ['Architectural Design', 'Technology', 'Fashion', 'Product Design', 'Media', 'Other']
const PLATFORMS: Platform[] = ['youtube', 'instagram', 'substack', 'tiktok', 'x', 'web']

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
    const { addProject } = useStudio()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<{
        title: string;
        tagline: string;
        description: string;
        type: ProjectType;
        platforms: Platform[];
        status: ProjectStatus;
        gtv_featured: boolean;
        cover_url: string;
        target_date: string;
        priority: 'urgent' | 'high' | 'mid' | 'low';
        impact_score: number;
        strategic_category: string;
    }>({
        title: '',
        tagline: '',
        description: '',
        type: 'Other',
        platforms: [],
        status: 'idea',
        gtv_featured: false,
        cover_url: '',
        target_date: '',
        priority: 'mid',
        impact_score: 5,
        strategic_category: 'personal'
    })
    const [coverFile, setCoverFile] = useState<File | null>(null)
    const [milestones, setMilestones] = useState<string[]>([])
    const [newMilestone, setNewMilestone] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title) return

        try {
            setLoading(true)
            await addProject(formData, milestones, coverFile || undefined)
            onClose()
            setFormData({
                title: '',
                tagline: '',
                description: '',
                type: 'Other',
                platforms: [],
                status: 'idea',
                gtv_featured: false,
                cover_url: '',
                target_date: '',
                priority: 'mid',
                impact_score: 5,
                strategic_category: 'personal'
            })
            setCoverFile(null)
            setMilestones([])
        } catch (err: any) {
            console.error('Failed to create project:', err)
            alert(`Error: ${err.message || 'Failed to create project'}`)
        } finally {
            setLoading(false)
        }
    }

    const togglePlatform = (p: Platform) => {
        setFormData(prev => ({
            ...prev,
            platforms: prev.platforms.includes(p)
                ? prev.platforms.filter((x: Platform) => x !== p)
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-sm font-bold focus:outline-none focus:border-orange-200 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input
                                    type="text"
                                    placeholder="Project Tagline"
                                    value={formData.tagline}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-medium focus:outline-none focus:border-orange-200 transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        placeholder="Cover Image URL (optional)"
                                        value={formData.cover_url}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, cover_url: e.target.value }))}
                                        className="flex-1 pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-medium focus:outline-none focus:border-orange-200 transition-all"
                                    />
                                    <label className="cursor-pointer group/upload relative">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCoverFile(e.target.files?.[0] || null)}
                                        />
                                        <div className={cn(
                                            "h-full px-4 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all",
                                            coverFile ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-black/5 hover:border-orange-200 bg-black/[0.02]"
                                        )}>
                                            <UploadCloud className="w-4 h-4" />
                                            {coverFile && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />}
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Initial Milestones */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Initial Roadmap</label>
                            {milestones.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {milestones.map((m, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-black/[0.02] border border-black/[0.05] rounded-xl group/ms">
                                            <div className="flex items-center gap-2">
                                                <CheckSquare className="w-3.5 h-3.5 text-black/20" />
                                                <span className="text-[12px] font-bold text-black">{m}</span>
                                            </div>
                                            <button
                                                onClick={() => setMilestones(prev => prev.filter((_, i) => i !== idx))}
                                                className="opacity-0 group-hover/ms:opacity-100 p-1 rounded-md hover:bg-red-50 text-red-400 transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="relative">
                                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input
                                    type="text"
                                    placeholder="Add a milestone (e.g. Prototype, Script, Launch...)"
                                    value={newMilestone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMilestone(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newMilestone.trim()) {
                                            e.preventDefault();
                                            setMilestones(prev => [...prev, newMilestone.trim()]);
                                            setNewMilestone('');
                                        }
                                    }}
                                    className="w-full pl-11 pr-4 py-3 bg-black/[0.01] border-2 border-dashed border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-orange-200 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Priority</label>
                                <div className="flex gap-2">
                                    {(['urgent', 'high', 'mid', 'low'] as const).map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, priority: level }))}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all",
                                                formData.priority === level
                                                    ? level === 'urgent' ? "bg-purple-50 text-purple-600 border-purple-200 shadow-sm"
                                                        : level === 'high' ? "bg-red-50 text-red-600 border-red-200 shadow-sm"
                                                            : level === 'mid' ? "bg-yellow-50 text-yellow-600 border-yellow-200 shadow-sm"
                                                                : "bg-black text-white border-black"
                                                    : "bg-black/[0.02] border-black/[0.05] text-black/30 hover:bg-black/[0.04]"
                                            )}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Strategic Category</label>
                                <select
                                    value={formData.strategic_category}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, strategic_category: e.target.value }))}
                                    className="w-full px-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-orange-200 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="rnd">R&D</option>
                                    <option value="production">Production</option>
                                    <option value="media">Media</option>
                                    <option value="growth">Growth</option>
                                    <option value="personal">Personal</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Target Completion Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input
                                    type="date"
                                    value={formData.target_date}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3 bg-black/[0.02] border border-black/[0.05] rounded-2xl text-[13px] font-bold focus:outline-none focus:border-orange-200 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2 flex justify-between">
                                Impact Score
                                <span className="text-orange-500 font-black">{formData.impact_score}/10</span>
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={formData.impact_score}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, impact_score: parseInt(e.target.value) }))}
                                className="w-full h-1.5 bg-black/[0.05] rounded-lg appearance-none cursor-pointer accent-black"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Primary Platforms</label>
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
                                        <PlatformIcon
                                            platform={p}
                                            className={cn(
                                                "w-3 h-3 transition-colors",
                                                formData.platforms.includes(p) ? "text-white" : "text-black/60 group-hover:text-orange-600"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-2">Brief / Description</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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

function Shield(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1-1z" />
        </svg>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
