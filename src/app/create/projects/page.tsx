'use client'

import { useState } from 'react'
import { Plus, Filter, Search } from 'lucide-react'
import ProjectKanban from '@/features/studio/components/ProjectKanban'
import CreateProjectModal from '@/features/studio/components/CreateProjectModal'
import { useStudio } from '@/features/studio/hooks/useStudio'

export default function ProjectsPage() {
    const { error } = useStudio()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    return (
        <main className="min-h-screen bg-[#FAFAFA] pb-24 pt-4 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {error && error.includes('relation') && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-2">
                        <p className="text-[13px] font-bold text-red-900">Database Tables Missing</p>
                        <p className="text-[11px] text-red-800/60">It looks like the Studio module tables haven't been created yet. Please execute the SQL migration script in your Supabase dashboard.</p>
                    </div>
                )}
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-black tracking-tight">Project Pipeline</h1>
                        <p className="text-[13px] text-black/40 font-medium">Manage your creative projects from idea to shipped product.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[12px] font-bold hover:scale-105 transition-transform shadow-lg shadow-black/10"
                        >
                            <Plus className="w-4 h-4" />
                            New Project
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

                <ProjectKanban />
            </div>

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </main>
    )
}
