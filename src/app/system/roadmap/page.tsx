'use client'

import { useState } from 'react'
import { ArrowLeft, Rocket, Sparkles, Clock, Plus, Trash2, History, Check } from 'lucide-react'
import { useRoadmap } from '@/features/system/hooks/useRoadmap'
import { cn } from '@/lib/utils'

export default function SystemRoadmapPage() {
    const { items, loading, addRoadmapItem, toggleRoadmapItem, deleteRoadmapItem } = useRoadmap()
    const [newFeature, setNewFeature] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const majorUpdates = items.filter(i => i.type === 'major_update')
    const futureFeatures = items.filter(i => i.type === 'future')

    const handleAddFeature = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newFeature.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            await addRoadmapItem({
                content: newFeature.trim(),
                type: 'future',
                is_completed: false
            })
            setNewFeature('')
        } catch (err) {
            console.error(err)
            alert("Failed to add feature.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="h-screen bg-[#fafafa] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-black/[0.06] px-6 py-5 z-20 shadow-sm flex-shrink-0">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <a href="/" className="w-10 h-10 rounded-xl bg-black/[0.03] flex items-center justify-center hover:bg-black/[0.06] transition-colors">
                        <ArrowLeft className="w-5 h-5 text-black/40" />
                    </a>
                    <div>
                        <h1 className="text-[20px] font-bold text-black tracking-tight">System Roadmap</h1>
                        <p className="text-[12px] text-black/35 mt-0.5">Evolution & Future Plans for KarrOS</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">

                    {/* Future Roadmap Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <Rocket className="w-4 h-4 text-orange-600" />
                                </div>
                                <h2 className="text-[16px] font-bold text-black">Future Features</h2>
                            </div>
                        </div>

                        {/* Input Box */}
                        <form onSubmit={handleAddFeature} className="bg-white p-2 rounded-2xl border border-black/[0.06] shadow-sm flex gap-2">
                            <input
                                type="text"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                placeholder="What's next for KarrOS?"
                                className="flex-1 px-4 py-2 bg-transparent text-[14px] text-black placeholder:text-black/20 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!newFeature.trim() || isSubmitting}
                                className="px-4 py-2 rounded-xl bg-black text-white text-[12px] font-bold hover:bg-black/80 transition-all disabled:opacity-30 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Idea
                            </button>
                        </form>

                        {/* Features List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {futureFeatures.map((item) => (
                                <div key={item.id} className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-sm group relative">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={() => toggleRoadmapItem(item.id, !item.is_completed)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all border-2",
                                                    item.is_completed
                                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                                        : "bg-white text-transparent border-black/10 hover:border-black/20"
                                                )}
                                                title={item.is_completed ? "Mark as planned" : "Mark as completed"}
                                            >
                                                <Check className={cn("w-3.5 h-3.5", item.is_completed ? "opacity-100" : "opacity-0")} />
                                            </button>
                                            <p className={cn(
                                                "text-[14px] font-medium leading-relaxed transition-all",
                                                item.is_completed ? "text-black/30 line-through" : "text-black/80"
                                            )}>
                                                {item.content}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => deleteRoadmapItem(item.id)}
                                            className="opacity-30 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all"
                                            title="Delete idea"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-black/[0.03] flex items-center justify-between">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest",
                                            item.is_completed ? "text-emerald-500/60" : "text-black/20"
                                        )}>
                                            {item.is_completed ? 'Completed' : 'Planned'}
                                        </span>
                                        <span className="text-[10px] text-black/20">{new Date(item.created_at).toLocaleDateString('en-GB')}</span>
                                    </div>
                                </div>
                            ))}
                            {futureFeatures.length === 0 && !loading && (
                                <div className="col-span-full py-10 text-center bg-black/[0.01] border border-dashed border-black/10 rounded-2xl">
                                    <p className="text-[13px] text-black/30">No future features noted yet. Start building the dream!</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Major Updates Timeline */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <History className="w-4 h-4 text-blue-600" />
                            </div>
                            <h2 className="text-[16px] font-bold text-black">Major Update History</h2>
                        </div>

                        <div className="relative ml-4 pl-8 border-l border-black/[0.06] space-y-10">
                            {majorUpdates.map((item, idx) => (
                                <div key={item.id} className="relative">
                                    {/* Dot */}
                                    <div className="absolute -left-[41px] top-0 w-[17px] h-[17px] rounded-full border-4 border-[#fafafa] bg-black ring-1 ring-black/[0.1]" />

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 rounded-lg bg-black text-white text-[10px] font-bold tracking-tight">
                                                {item.version}
                                            </span>
                                            <span className="text-[12px] font-bold text-black/30">
                                                {new Date(item.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-sm">
                                            <p className="text-[14px] text-black/80 font-medium leading-relaxed">{item.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </div>
    )
}
