'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Briefcase, Target, LayoutDashboard, Shield, Plus, Clock, ExternalLink, ArrowRight } from 'lucide-react'
import { useStudio } from '../hooks/useStudio'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import CreateProjectModal from './CreateProjectModal'
import CreateSparkModal from './CreateSparkModal'
import ProjectDetailModal from './ProjectDetailModal'
import SparkDetailModal from './SparkDetailModal'
import PlatformIcon from './PlatformIcon'
import type { StudioProject, StudioSpark } from '../types/studio.types'

export default function StudioDashboard() {
    const { projects, sparks, content, loading, error } = useStudio()
    const [daysUntilGTV, setDaysUntilGTV] = useState(0)
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
    const [isSparkModalOpen, setIsSparkModalOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<StudioProject | null>(null)
    const [selectedSpark, setSelectedSpark] = useState<StudioSpark | null>(null)

    useEffect(() => {
        const target = new Date('2026-09-01')
        const now = new Date()
        const diff = target.getTime() - now.getTime()
        setDaysUntilGTV(Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }, [])

    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'research')
    const recentSparks = sparks.slice(0, 4)

    return (
        <div className="space-y-6">
            {error && error.includes('relation') && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-2">
                    <p className="text-[13px] font-bold text-red-900">Database Tables Missing</p>
                    <p className="text-[11px] text-red-800/60">It looks like the Studio module tables haven't been created yet. Please execute the SQL migration script in your Supabase dashboard.</p>
                </div>
            )}
            {/* GTV Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A2647] to-[#144272] p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300/80 mb-2">Global Talent Visa Pipeline</p>
                    <div className="flex items-end gap-3 mb-6">
                        <h1 className="text-5xl font-black">{daysUntilGTV}</h1>
                        <p className="text-xl font-medium text-blue-200/60 pb-1">days until September 2026</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex -space-x-3">
                            {projects.filter(p => p.gtv_featured).slice(0, 4).map((p, i) => (
                                <div key={p.id} className="w-10 h-10 rounded-full border-2 border-blue-900 bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-xs ring-4 ring-[#0A2647] overflow-hidden">
                                    {p.title[0]}
                                </div>
                            ))}
                            {projects.filter(p => p.gtv_featured).length > 4 && (
                                <div className="w-10 h-10 rounded-full border-2 border-blue-900 bg-blue-800 flex items-center justify-center text-blue-200 font-bold text-xs ring-4 ring-[#0A2647]">
                                    +{projects.filter(p => p.gtv_featured).length - 4}
                                </div>
                            )}
                            {projects.filter(p => p.gtv_featured).length === 0 && (
                                <div className="w-10 h-10 rounded-full border-2 border-dashed border-blue-400/30 flex items-center justify-center text-blue-400/50 text-[10px] ring-4 ring-[#0A2647]">
                                    0
                                </div>
                            )}
                        </div>
                        <p className="text-[13px] font-medium text-blue-100/70">
                            Evidence portfolio is <span className="text-white font-bold">{Math.min(100, Math.round((projects.filter(p => p.gtv_featured).length / 10) * 100))}%</span> recommended volume
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Projects Summary */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[13px] font-bold text-black uppercase tracking-wider flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-orange-500" />
                            Active Pipeline
                        </h2>
                        <Link href="/create/projects" className="text-[11px] font-bold text-black/40 hover:text-black transition-colors">See Kanban</Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {loading ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="h-32 bg-black/[0.02] border border-black/[0.05] rounded-2xl animate-pulse" />
                            ))
                        ) : activeProjects.length === 0 ? (
                            <div className="col-span-2 py-12 bg-white border border-black/[0.05] rounded-3xl flex flex-col items-center justify-center text-center px-6">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                                    <Sparkles className="w-6 h-6 text-orange-500" />
                                </div>
                                <h3 className="text-sm font-bold text-black">No active projects</h3>
                                <p className="text-[12px] text-black/40 mt-1 max-w-[240px]">Transform your sparks into projects to start your GTV portfolio.</p>
                                <button
                                    onClick={() => setIsProjectModalOpen(true)}
                                    className="mt-4 px-4 py-2 bg-black text-white text-[11px] font-bold rounded-xl hover:scale-105 transition-transform"
                                >
                                    Start New Project
                                </button>
                            </div>
                        ) : (
                            activeProjects.map(project => (
                                <div
                                    key={project.id}
                                    onClick={() => setSelectedProject(project)}
                                    className="p-4 bg-white border border-black/[0.05] rounded-2xl hover:border-orange-200 hover:shadow-lg transition-all group cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tight",
                                            project.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                                        )}>
                                            {project.status}
                                        </div>
                                        {project.gtv_featured && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                                    </div>
                                    <h4 className="text-[14px] font-black text-black leading-tight group-hover:text-orange-600 transition-colors">{project.title}</h4>
                                    <p className="text-[11px] text-black/40 mt-1 line-clamp-2">{project.tagline || 'No tagline set'}</p>

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex gap-1">
                                            {project.platforms?.slice(0, 3).map(p => (
                                                <div key={p} className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-black border border-black/5">
                                                    <PlatformIcon platform={p} className="w-2.5 h-2.5" />
                                                </div>
                                            ))}
                                        </div>
                                        {project.target_date && (
                                            <div className="flex items-center gap-1 text-[10px] text-black/30 font-bold">
                                                <Clock className="w-3 h-3" />
                                                {new Date(project.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    {/* Quick Sparks */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[13px] font-bold text-black uppercase tracking-wider flex items-center gap-2">
                                <Target className="w-4 h-4 text-emerald-500" />
                                Recent Sparks
                            </h2>
                            <Link href="/create/sparks" className="text-[11px] font-bold text-black/40 hover:text-black transition-colors">See Grid</Link>
                        </div>

                        <div className="space-y-2">
                            {recentSparks.map(spark => (
                                <div
                                    key={spark.id}
                                    onClick={() => setSelectedSpark(spark)}
                                    className="p-3 bg-white border border-black/[0.04] rounded-xl flex items-center gap-3 group hover:border-emerald-200 cursor-pointer transition-all"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-black/[0.02] flex items-center justify-center text-sm border border-black/[0.05]">
                                        {{
                                            idea: '💡',
                                            tool: '🛠️',
                                            item: '🛒',
                                            resource: '🔗',
                                            event: '📅',
                                            person: '👤',
                                            platform: '📱'
                                        }[spark.type] || '✨'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-black truncate">{spark.title}</p>
                                        <p className="text-[10px] text-black/30 font-medium uppercase tracking-tight">{spark.type}</p>
                                    </div>
                                    {spark.url && (
                                        <a
                                            href={spark.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-black/20 hover:text-emerald-600 transition-all"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={() => setIsSparkModalOpen(true)}
                                className="w-full p-3 border-2 border-dashed border-black/[0.05] rounded-xl flex items-center justify-center gap-2 text-[12px] font-bold text-black/40 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all group"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                Capture New Spark
                            </button>
                        </div>
                    </div>

                    {/* Content Pulse */}
                    <div className="p-5 bg-white border border-black/[0.06] rounded-[32px] space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <LayoutDashboard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-black text-black leading-none">Content Pipeline</h3>
                                <p className="text-[11px] text-black/40 mt-1">{content.length} active ideas & posts</p>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-black/[0.05]">
                            <Link href="/create/content" className="flex items-center justify-between text-[11px] font-bold text-black group hover:text-blue-600 transition-colors">
                                Open Content Calendar
                                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <CreateProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
            />
            <CreateSparkModal
                isOpen={isSparkModalOpen}
                onClose={() => setIsSparkModalOpen(false)}
            />
            <ProjectDetailModal
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                project={selectedProject}
            />
            <SparkDetailModal
                isOpen={!!selectedSpark}
                onClose={() => setSelectedSpark(null)}
                spark={selectedSpark}
                projects={projects}
            />
        </div>
    )
}
