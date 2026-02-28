'use client'

import { Target, ExternalLink, Calendar, Plus, MoreVertical, Tag, Briefcase } from 'lucide-react'
import { useStudio } from '../hooks/useStudio'
import type { StudioSpark } from '../types/studio.types'
import { cn } from '@/lib/utils'

export default function SparksGrid() {
    const { sparks, projects, loading } = useStudio()

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sparks.map(spark => (
                <SparkCard key={spark.id} spark={spark} projects={projects} />
            ))}
        </div>
    )
}

function SparkCard({ spark, projects }: { spark: StudioSpark; projects: any[] }) {
    const linkedProject = projects.find(p => p.id === spark.project_id)

    const typeIcon = {
        idea: '💡',
        tool: '🛠️',
        item: '🛒',
        resource: '🔗',
        event: '📅',
        person: '👤',
        platform: '📱'
    }[spark.type] || '✨'

    return (
        <div className="group relative p-6 bg-white border border-black/[0.05] rounded-[32px] hover:border-emerald-200 hover:shadow-xl transition-all flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-2xl bg-black/[0.02] flex items-center justify-center text-xl border border-black/[0.03] group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                    {typeIcon}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {spark.url && (
                        <a
                            href={spark.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl hover:bg-emerald-50 text-black/20 hover:text-emerald-600 transition-all"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                    <button className="p-2 rounded-xl hover:bg-black/5 text-black/20 hover:text-black/60 transition-all">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <h4 className="text-[15px] font-black text-black leading-tight mb-2 group-hover:text-emerald-600 transition-colors">
                    {spark.title}
                </h4>
                {spark.notes && (
                    <p className="text-[12px] text-black/50 line-clamp-3 leading-relaxed">
                        {spark.notes}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-black/[0.03] space-y-3">
                {/* Tags */}
                {spark.tags && spark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {spark.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-md bg-black/[0.02] text-[9px] font-black uppercase text-black/30 tracking-tight">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {linkedProject ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-lg max-w-[120px]">
                                <Briefcase className="w-3 h-3 text-blue-600 shrink-0" />
                                <span className="text-[9px] font-black text-blue-900 truncate uppercase tracking-tighter">
                                    {linkedProject.title}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[10px] text-black/20 font-bold">
                                <Calendar className="w-3 h-3" />
                                {new Date(spark.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                        )}
                    </div>

                    {spark.price && (
                        <div className="text-[11px] font-black text-emerald-600">
                            £{spark.price}
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Action Indicator */}
            <div className="absolute inset-x-8 bottom-0 h-1 bg-emerald-500 scale-x-0 group-hover:scale-x-50 transition-transform rounded-full" />
        </div>
    )
}
