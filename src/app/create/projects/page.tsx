'use client'

import { useState } from 'react'
import ProjectKanban from '@/features/studio/components/ProjectKanban'
import ProjectMatrix from '@/features/studio/components/ProjectMatrix'
import ProjectTimeline from '@/features/studio/components/ProjectTimeline'
import CreateProjectModal from '@/features/studio/components/CreateProjectModal'
import ProjectDetailModal from '@/features/studio/components/ProjectDetailModal'
import { useStudio } from '@/features/studio/hooks/useStudio'
import { Plus, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StudioProject } from '@/features/studio/types/studio.types'

export default function ProjectsPage() {
    const { error } = useStudio()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [view, setView] = useState<'board' | 'matrix' | 'timeline'>('board')
    const [selectedProject, setSelectedProject] = useState<StudioProject | null>(null)

    return (
        <main className="pb-24 pt-4 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {error && error.includes('relation') && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-2">
                        <p className="text-[13px] font-bold text-red-900">Database Tables Missing</p>
                        <p className="text-[11px] text-red-800/60">It looks like the Studio module tables haven't been created yet. Please execute the SQL migration script in your Supabase dashboard.</p>
                    </div>
                )}
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-black tracking-tight font-outfit">Project Pipeline</h1>
                        <p className="text-[13px] text-black/40 font-bold uppercase tracking-widest mt-1">Strategic Development</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-black/[0.03] p-1 rounded-xl border border-black/[0.04] items-center">
                            {(['board', 'matrix', 'timeline'] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all",
                                        view === v ? 'bg-white text-black shadow-sm' : 'text-black/30 hover:text-black/60'
                                    )}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-[12px] font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden xs:inline">New Project</span>
                            <span className="xs:hidden">Add</span>
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-black/[0.05] rounded-xl text-[13px] focus:outline-none focus:border-orange-200 transition-all font-medium"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-black/[0.05] rounded-xl text-[12px] font-bold text-black/60 hover:bg-black/[0.02] transition-colors">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>

                {view === 'board' && <ProjectKanban />}
                {view === 'matrix' && <ProjectMatrix />}
                {view === 'timeline' && <ProjectTimeline onProjectClick={setSelectedProject} />}
            </div>

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            <ProjectDetailModal
                isOpen={!!selectedProject}
                onClose={() => setSelectedProject(null)}
                project={selectedProject}
            />
        </main>
    )
}
