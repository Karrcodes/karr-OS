'use client'

import { Target, Plus, Search, Grid, List as ListIcon } from 'lucide-react'
import { useState } from 'react'

export default function SparksPage() {
    const [view, setView] = useState<'grid' | 'list'>('grid')

    return (
        <main className="min-h-screen bg-[#FAFAFA] pb-24 pt-4 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-black tracking-tight">Studio Sparks</h1>
                        <p className="text-[13px] text-black/40 font-medium">Capture ideas, tools, items, and inspiration instantly.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[12px] font-bold hover:scale-105 transition-transform shadow-lg shadow-black/10">
                            <Plus className="w-4 h-4" />
                            New Spark
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                        <input
                            type="text"
                            placeholder="Search sparks by title or tag..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-black/[0.05] rounded-xl text-[13px] focus:outline-none focus:border-emerald-200 transition-all font-medium"
                        />
                    </div>
                    <div className="flex items-center bg-white border border-black/[0.05] rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setView('grid')}
                            className={cn("p-1.5 rounded-lg transition-all", view === 'grid' ? "bg-black/5 text-black" : "text-black/20 hover:text-black/40")}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={cn("p-1.5 rounded-lg transition-all", view === 'list' ? "bg-black/5 text-black" : "text-black/20 hover:text-black/40")}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Grid Placeholder */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-[4/5] rounded-3xl bg-black/[0.015] border-2 border-dashed border-black/[0.03] flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-4">
                                <Target className="w-6 h-6 text-black/10" />
                            </div>
                            <p className="text-[12px] font-bold text-black/10 italic">Empty spark slot {i}</p>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
