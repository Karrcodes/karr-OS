'use client'

import React, { useState } from 'react'
import { Activity, Plus, Search, Users, Globe, MapPin, LayoutDashboard, List as ListIcon, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import SparksGrid from '@/features/studio/components/SparksGrid'
import CreateSparkModal from '@/features/studio/components/CreateSparkModal'

export default function SparksPage() {
    const [view, setView] = useState<'focused' | 'list'>('focused')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <main className="pb-12 pt-4 px-4 md:px-8 flex flex-col min-h-screen">
            <div className="mx-auto space-y-6 w-full max-w-7xl">
                {/* Row 1: Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-[22px] font-bold text-black tracking-tight">Sparks Inbox</h1>
                        <p className="text-[12px] text-black/35 mt-0.5">Capture and process every idea · Studio Module</p>
                    </div>

                    <div className="flex bg-black/[0.03] p-1 rounded-xl border border-black/[0.04] items-center gap-0.5">
                        {[
                            { label: 'Focused', value: 'focused' as const, icon: LayoutDashboard },
                            { label: 'List', value: 'list' as const, icon: ListIcon },
                        ].map(({ label, value, icon: Icon }) => (
                            <button
                                key={value}
                                onClick={() => setView(value)}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all",
                                    view === value ? 'bg-white text-black shadow-sm' : 'text-black/30 hover:text-black/60'
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 2: Search */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                    <input
                        type="text"
                        placeholder="Search sparks..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-black/[0.05] rounded-xl text-[13px] focus:outline-none focus:border-orange-200 transition-all font-medium"
                    />
                </div>

                {/* Row 4: Filters and Add (Rendered within SparksGrid) */}
                <SparksGrid
                    searchQuery={searchQuery}
                    view={view}
                    renderAddButton={() => (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-[12px] font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 self-start sm:self-auto"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden xs:inline">Create Spark</span>
                            <span className="xs:hidden">Add</span>
                        </button>
                    )}
                />
            </div>

            <CreateSparkModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </main>
    )
}
