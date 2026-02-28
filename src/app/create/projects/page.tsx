'use client'

import { Briefcase, Plus, Filter, Search } from 'lucide-react'

export default function ProjectsPage() {
    return (
        <main className="min-h-screen bg-[#FAFAFA] pb-24 pt-4 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-black tracking-tight">Project Pipeline</h1>
                        <p className="text-[13px] text-black/40 font-medium">Manage your creative projects from idea to shipped product.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[12px] font-bold hover:scale-105 transition-transform shadow-lg shadow-black/10">
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

                {/* Kanban Placeholder (Phase 1) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[600px]">
                    {['Idea', 'Research', 'Active', 'Shipped'].map(column => (
                        <div key={column} className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-black/30">{column}</h3>
                                <span className="text-[10px] font-bold text-black/20 bg-black/5 px-1.5 rounded-md">0</span>
                            </div>
                            <div className="flex-1 rounded-3xl bg-black/[0.015] border-2 border-dashed border-black/[0.03] p-4 flex flex-col items-center justify-center text-center">
                                <p className="text-[12px] font-bold text-black/10 italic">No projects in {column}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
