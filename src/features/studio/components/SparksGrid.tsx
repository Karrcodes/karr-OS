'use client'

import { Target, ExternalLink, Calendar, Plus, MoreVertical, Tag, Briefcase, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useStudio } from '../hooks/useStudio'
import type { StudioSpark } from '../types/studio.types'
import { cn } from '@/lib/utils'
import SparkDetailModal from './SparkDetailModal'

export default function SparksGrid() {
    const { sparks, projects, deleteSpark, loading } = useStudio()
    const [selectedSpark, setSelectedSpark] = useState<StudioSpark | null>(null)

    useEffect(() => {
        const handleDelete = async (e: any) => {
            try {
                await deleteSpark(e.detail)
            } catch (err: any) {
                alert(`Failed to delete spark: ${err.message}`)
            }
        }
        window.addEventListener('studio:deleteSpark', handleDelete)
        return () => window.removeEventListener('studio:deleteSpark', handleDelete)
    }, [deleteSpark])

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="aspect-[4/5] bg-black/[0.02] border border-black/[0.05] rounded-3xl animate-pulse" />
                ))}
            </div>
        )
    }

    if (sparks.length === 0) {
        return (
            <div className="py-24 flex flex-col items-center justify-center text-center px-4 bg-black/[0.01] rounded-[48px] border-2 border-dashed border-black/[0.03]">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6">
                    <Target className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-black">Your mind is currenty clear</h3>
                <p className="text-[14px] text-black/40 mt-2 max-w-[320px]">
                    Sparks are the seeds of your future projects. Capture every idea, tool, and link you find interesting.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sparks.map(spark => (
                    <SparkCard
                        key={spark.id}
                        spark={spark}
                        projects={projects}
                        onClick={() => setSelectedSpark(spark)}
                    />
                ))}
            </div>

            <SparkDetailModal
                isOpen={!!selectedSpark}
                onClose={() => setSelectedSpark(null)}
                spark={selectedSpark}
                projects={projects}
            />
        </>
    )
}

function SparkCard({ spark, projects, onClick }: { spark: StudioSpark; projects: any[]; onClick: () => void }) {
    const linkedProject = projects.find(p => p.id === spark.project_id)

    const typeEmoji = {
        idea: '💡',
        tool: '🛠️',
        item: '🛒',
        resource: '🔗',
        event: '📅',
        person: '👤',
        platform: '📱'
    }[spark.type] || '✨'

    return (
        <div
            onClick={onClick}
            className="group relative p-6 bg-white border border-black/[0.05] rounded-[32px] hover:border-emerald-200 hover:shadow-xl transition-all flex flex-col cursor-pointer"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-black/[0.02] flex items-center justify-center text-xl border border-black/[0.03] group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors overflow-hidden shrink-0 p-1">
                    {spark.icon_url ? (
                        <img src={spark.icon_url} alt={spark.title} className="w-full h-full object-contain" />
                    ) : (
                        typeEmoji
                    )}
                </div>
                <div className="flex items-center gap-1.5 opacity-100 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete this spark?`)) {
                                window.dispatchEvent(new CustomEvent('studio:deleteSpark', { detail: spark.id }));
                            }
                        }}
                        className="p-1 px-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase">Delete</span>
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-black/5 text-black/20 hover:text-black transition-all">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-tight">
                        {spark.type}
                    </span>
                    {spark.url && <ExternalLink className="w-3 h-3 text-black/20" />}
                </div>
                <h4 className="text-[15px] font-black text-black leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {spark.title}
                </h4>
                {spark.notes && (
                    <p className="text-[12px] text-black/40 line-clamp-3 leading-relaxed font-medium">
                        {spark.notes}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-black/[0.03] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {linkedProject ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 rounded-lg max-w-[140px]">
                            <Briefcase className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="text-[10px] font-bold text-blue-700 truncate">{linkedProject.title}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-black/20">
                            <Tag className="w-3 h-3" />
                            <span>Standalone</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-black/20">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(spark.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
            </div>
        </div>
    )
}
