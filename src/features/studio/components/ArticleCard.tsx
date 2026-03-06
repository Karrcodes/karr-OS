'use client'
import { Pin, Trash2, Archive, Link2, Rocket, Video, BookOpen, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StudioDraft } from '../types/studio.types'

interface Props {
    draft: StudioDraft
    onClick: () => void
    onPin: () => void
    onDelete: () => void
    onArchive: () => void
}

export default function ArticleCard({ draft, onClick, onPin, onDelete, onArchive }: Props) {
    const references = draft.node_references || []
    const counts = {
        notes: references.filter(r => r.node_type === 'entry').length,
        projects: references.filter(r => r.node_type === 'project').length,
        content: references.filter(r => r.node_type === 'content').length
    }

    const hasReferences = counts.notes > 0 || counts.projects > 0 || counts.content > 0

    // Extract images from HTML body
    const images = (() => {
        const urls: string[] = []
        if (!draft.body) return urls
        const imgRegex = /<img [^>]*src="([^"]*)"[^>]*>/g
        let match
        while ((match = imgRegex.exec(draft.body)) !== null) {
            if (match[1] && !urls.includes(match[1])) urls.push(match[1])
        }
        return urls.slice(0, 3) // Show top 3 in stack
    })()

    return (
        <div
            className="group relative rounded-[32px] border border-black/[0.06] p-5 cursor-pointer transition-all hover:shadow-xl hover:border-indigo-200/50 flex flex-col gap-3 bg-white hover:-translate-y-1 duration-300"
            onClick={onClick}
        >
            {/* Image Stack Visual */}
            {images.length > 0 && (
                <div className="relative h-32 w-full mb-2 bg-black/[0.02] rounded-[24px] overflow-hidden flex items-center justify-center border border-black/[0.03]">
                    <div className="flex items-center justify-center relative w-full h-full p-4">
                        {images.map((src, i) => (
                            <div
                                key={src}
                                className="absolute w-[140px] h-[90px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 border-2 border-white"
                                style={{
                                    zIndex: 10 - i,
                                    transform: `translateX(${i * 12}px) translateY(${i * -4}px) rotate(${i * 4 - 4}deg) scale(${1 - i * 0.05})`,
                                    opacity: 1 - i * 0.2
                                }}
                            >
                                <img src={src} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                        ))}
                    </div>
                    {/* Glass Overlay on hover */}
                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/[0.02] transition-colors duration-500" />
                </div>
            )}

            {/* Pin indicator */}
            {draft.pinned && (
                <div className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center text-black/30 z-20">
                    <Pin className="w-3.5 h-3.5 fill-current" />
                </div>
            )}

            {/* Header Row: Icon and Counts */}
            <div className="flex items-center gap-2 mb-1 relative z-10">
                <div className={cn("w-2 h-2 rounded-full shrink-0", images.length > 0 ? "bg-emerald-400" : "bg-indigo-400")} />

                {hasReferences && (
                    <div className="flex items-center gap-2 opacity-60">
                        {counts.notes > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-indigo-500 uppercase tracking-tighter">
                                <Link2 className="w-2.5 h-2.5" />
                                {counts.notes}
                            </span>
                        )}
                        {counts.projects > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-orange-500 uppercase tracking-tighter">
                                <Rocket className="w-2.5 h-2.5" />
                                {counts.projects}
                            </span>
                        )}
                        {counts.content > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black text-blue-500 uppercase tracking-tighter">
                                <Video className="w-2.5 h-2.5" />
                                {counts.content}
                            </span>
                        )}
                    </div>
                )}
                <div className="ml-auto opacity-20">
                    {images.length > 0 ? <ImageIcon className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                </div>
            </div>

            {/* Content Row */}
            <div className="flex flex-col gap-1 relative z-10">
                <h3 className="text-[15px] font-black text-black leading-tight line-clamp-2 pr-6 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {draft.title || 'Untitled Article'}
                </h3>
                {draft.body && (
                    <p className="text-[12px] text-black/40 leading-relaxed line-clamp-3 mt-1 font-medium">
                        {draft.body.replace(/<[^>]*>/g, '').replace(/[#*`>]/g, '').trim().slice(0, 160)}
                    </p>
                )}
            </div>

            {/* Date & Status */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.04] relative z-10">
                <p className="text-[9px] text-black/20 font-black uppercase tracking-widest">
                    {new Date(draft.updated_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </p>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onPin(); }}
                        className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95",
                            draft.pinned ? "bg-black text-white shadow-lg" : "text-black/20 hover:text-black hover:bg-black/5"
                        )}
                    >
                        <Pin className={cn("w-3.5 h-3.5", draft.pinned && "fill-current")} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onArchive(); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-black/20 hover:text-white hover:bg-amber-500 transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-amber-500/20"
                    >
                        <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-black/20 hover:text-white hover:bg-red-500 transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-red-500/20"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
