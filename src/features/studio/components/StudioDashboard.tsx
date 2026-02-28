'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Briefcase, Target, LayoutDashboard, Activity, Shield, Plus, Clock, ExternalLink, ArrowRight } from 'lucide-react'
import { useStudio } from '../hooks/useStudio'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function StudioDashboard() {
    const { projects, sparks, loading } = useStudio()
    const [daysUntilGTV, setDaysUntilGTV] = useState(0)

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
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-900 bg-blue-100 flex items-center justify-center text-blue-900 font-bold text-xs ring-4 ring-[#0A2647]">
                                    {i}
                                </div>
                            ))}
                            <div className="w-10 h-10 rounded-full border-2 border-blue-900 bg-blue-800 flex items-center justify-center text-blue-200 font-bold text-xs ring-4 ring-[#0A2647]">
                                +{projects.filter(p => p.gtv_featured).length}
                            </div>
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
                                <button className="mt-4 px-4 py-2 bg-black text-white text-[11px] font-bold rounded-xl hover:scale-105 transition-transform">Start New Project</button>
                            </div>
                        ) : (
                            activeProjects.map(project => (
                                <Link
                                    key={project.id}
                                    href={`/create/projects?id=${project.id}`}
                                    className="p-4 bg-white border border-black/[0.05] rounded-2xl hover:border-orange-200 hover:shadow-lg transition-all group"
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
                                                <div key={p} className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[8px] font-bold border border-black/5">
                                                    {p[0].toUpperCase()}
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
                                </Link>
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
                                <div key={spark.id} className="p-3 bg-white border border-black/[0.04] rounded-xl flex items-center gap-3 group hover:border-emerald-200 transition-all">
                                    <div className="w-8 h-8 rounded-lg bg-black/[0.02] flex items-center justify-center text-sm border border-black/[0.05]">
                                        {spark.type === 'tool' ? '🛠️' : spark.type === 'item' ? '🛒' : '💡'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-black truncate">{spark.title}</p>
                                        <p className="text-[10px] text-black/30 font-medium uppercase tracking-tight">{spark.type}</p>
                                    </div>
                                    {spark.url && (
                                        <a href={spark.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-50 text-black/20 hover:text-emerald-600 transition-all">
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            ))}
                            <button className="w-full p-3 border-2 border-dashed border-black/[0.05] rounded-xl flex items-center justify-center gap-2 text-[12px] font-bold text-black/40 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all group">
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                Capture New Spark
                            </button>
                        </div>
                    </div>

                    {/* Content Pulse (Placeholder for now) */}
                    <div className="p-5 bg-white border border-black/[0.06] rounded-[32px] space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <LayoutDashboard className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[13px] font-black text-black leading-none">Content Planner</h3>
                                <p className="text-[11px] text-black/40 mt-1">Next post in 2 days</p>
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
        </div>
    )
}
