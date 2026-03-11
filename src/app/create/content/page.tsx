'use client'

import React, { useState } from 'react'
import ContentKanban from '@/features/studio/components/ContentKanban'
import ProjectMatrix from '@/features/studio/components/ProjectMatrix'
import ContentCalendar from '@/features/studio/components/ContentCalendar'
import { cn } from '@/lib/utils'
import { LayoutGrid, Network, Calendar, Search, Grid, List as ListIcon } from 'lucide-react'

export default function ContentPage() {
    const [view, setView] = useState<'board' | 'matrix' | 'planner'>('board')
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <main className={cn("pb-20 pt-8 md:pt-10 px-6 md:px-10 flex flex-col", view !== 'matrix' && "flex-1")}>
            <div className={cn("mx-auto space-y-10 w-full", view === 'matrix' ? 'max-w-7xl' : 'max-w-7xl flex-1')}>

                {/* Unified Header Row — matches projects page layout */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.3em]">Studio Protocol</h2>
                        <h1 className="text-4xl font-black text-black tracking-tighter uppercase grayscale">Content Pipeline</h1>
                    </div>

                    {/* View toggle */}
                    <div className="flex bg-black/[0.03] p-1.5 rounded-2xl border border-black/[0.05] items-center gap-0.5 h-fit mb-1 self-start sm:self-auto">
                        {([
                            { label: 'Board', value: 'board' as const, icon: LayoutGrid },
                            { label: 'Planner', value: 'planner' as const, icon: Calendar },
                            { label: 'Matrix', value: 'matrix' as const, icon: Network },
                        ]).map(({ label, value, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => setView(value)}
                                className={cn(
                                    "items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all",
                                    view === value ? 'bg-white text-black shadow-sm' : 'text-black/30 hover:text-black/60',
                                    value === 'board' ? 'flex' : 'hidden sm:flex'
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span className={value !== 'board' ? "hidden sm:inline" : ""}>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toolbar - Search only */}
                {view === 'board' && (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                            <input
                                type="text"
                                placeholder="Search content by title, category or type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-black/[0.05] rounded-xl text-[13px] focus:outline-none focus:border-orange-200 transition-all font-medium"
                            />
                        </div>
                    </div>
                )}

                {/* Views — Kanban hides its own title since the page header covers it */}
                {view === 'board' && <ContentKanban hideHeader searchQuery={searchQuery} />}
                {view === 'matrix' && <ProjectMatrix />}
                {view === 'planner' && <ContentCalendar />}

            </div>
        </main >
    )
}
