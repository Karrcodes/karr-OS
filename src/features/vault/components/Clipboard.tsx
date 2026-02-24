'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Copy, Trash2, Check, ExternalLink, List } from 'lucide-react'
import { LinkPreview } from './LinkPreview'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_VAULT } from '@/lib/demoData'

interface Clip {
    id: string
    content: string
    created_at: string
}

export function Clipboard() {
    const [clips, setClips] = useState<Clip[]>([])
    const [newClip, setNewClip] = useState('')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const { settings } = useSystemSettings()

    const fetchClips = async () => {
        if (settings.is_demo_mode) {
            setClips(MOCK_VAULT.clips)
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('sys_clipboard')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)

        if (!error && data) {
            setClips(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchClips()
        // Poll every 30 seconds for new clips from other devices (only if not in demo mode)
        let interval: any
        if (!settings.is_demo_mode) {
            interval = setInterval(fetchClips, 30000)
        }
        return () => { if (interval) clearInterval(interval) }
    }, [settings.is_demo_mode])

    const handleAdd = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newClip.trim()) return

        setAdding(true)
        const { error } = await supabase
            .from('sys_clipboard')
            .insert({ content: newClip.trim(), profile: 'personal' })

        if (!error) {
            setNewClip('')
            fetchClips()
        }
        setAdding(false)
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('sys_clipboard')
            .delete()
            .eq('id', id)

        if (!error) {
            setClips(clips.filter(c => c.id !== id))
        }
    }

    const handleCopy = (id: string, content: string) => {
        navigator.clipboard.writeText(content)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const isUrl = (str: string) => {
        try {
            new URL(str)
            return true
        } catch {
            return false
        }
    }

    return (
        <div className="space-y-4">
            {/* Input Area */}
            <div className="relative group">
                <textarea
                    value={newClip}
                    onChange={(e) => setNewClip(e.target.value)}
                    placeholder="Paste a link or message to share..."
                    className="w-full h-32 p-4 pb-12 pr-14 bg-white border border-black/[0.08] rounded-2xl resize-none outline-none focus:border-black/20 focus:ring-4 focus:ring-black/[0.02] transition-all text-[14px] leading-relaxed placeholder:text-black/20"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleAdd()
                        }
                    }}
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => {
                            const textarea = document.querySelector('textarea')
                            if (!textarea) return
                            const start = textarea.selectionStart
                            const end = textarea.selectionEnd
                            const text = textarea.value
                            const before = text.substring(0, start)
                            const after = text.substring(end)
                            const selected = text.substring(start, end)

                            // If multi-line selection, bullet each line
                            if (selected.includes('\n')) {
                                const bulleted = selected.split('\n').map(line => line.startsWith('- ') ? line : `- ${line}`).join('\n')
                                setNewClip(before + bulleted + after)
                            } else {
                                // Just insert bullet at cursor or before selection
                                setNewClip(before + (selected.startsWith('- ') ? selected : `- ${selected}`) + after)
                            }
                        }}
                        className="p-1.5 text-black/40 hover:text-black hover:bg-black/5 rounded-lg transition-all"
                        title="Add bullet points"
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
                <button
                    onClick={() => handleAdd()}
                    type="button"
                    disabled={adding || !newClip.trim()}
                    className="absolute bottom-3 right-3 w-10 h-10 bg-black text-white rounded-xl shadow-lg shadow-black/10 flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100 transition-all z-10"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* List Area */}
            <div className="space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin" />
                        <p className="text-[11px] font-medium text-black/40 uppercase tracking-widest">Accessing Vault...</p>
                    </div>
                ) : clips.length === 0 ? (
                    <div className="bg-black/[0.02] border border-dashed border-black/[0.06] rounded-2xl py-12 text-center text-black/30">
                        <p className="text-[13px] font-medium">Vault is currently empty</p>
                        <p className="text-[11px]">Start sharing links across your devices</p>
                    </div>
                ) : (
                    clips.map((clip) => (
                        <ClipItem
                            key={clip.id}
                            clip={clip}
                            copiedId={copiedId}
                            handleCopy={handleCopy}
                            handleDelete={handleDelete}
                            isUrl={isUrl}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

function ClipItem({ clip, copiedId, handleCopy, handleDelete, isUrl }: {
    clip: Clip,
    copiedId: string | null,
    handleCopy: (id: string, content: string) => void,
    handleDelete: (id: string) => void,
    isUrl: (str: string) => boolean
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isTruncatable, setIsTruncatable] = useState(false)
    const contentRef = React.useRef<HTMLParagraphElement>(null)

    useEffect(() => {
        if (contentRef.current) {
            // Check if content overflows its container's 3-line limit (approx 3 * lineHeight)
            // A more reliable way is comparing scrollHeight to offsetHeight
            const element = contentRef.current
            setIsTruncatable(element.scrollHeight > element.offsetHeight)
        }
    }, [clip.content])

    return (
        <div className="bg-white border border-black/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors overflow-hidden">
            <div className="flex-1 min-w-0 w-full">
                <div className="relative">
                    <div className={cn(
                        "text-[14px] leading-relaxed text-black/70 break-words",
                        !isExpanded && "line-clamp-6"
                    )}>
                        {clip.content.split('\n').map((line, i) => {
                            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                return (
                                    <div key={i} className="flex gap-2 mb-1 pl-1">
                                        <span className="text-black/30 mt-1.5 w-1 h-1 rounded-full bg-black/40 shrink-0" />
                                        <span>{line.trim().substring(2)}</span>
                                    </div>
                                )
                            }
                            return (
                                <p key={i} className={cn(
                                    "mb-1",
                                    isUrl(line.trim()) && "text-blue-600 font-medium underline underline-offset-4 decoration-blue-200 break-all"
                                )}>
                                    {line}
                                </p>
                            )
                        })}
                    </div>
                    {isTruncatable && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-[11px] font-bold text-black/40 hover:text-black mt-2 transition-colors uppercase tracking-wider"
                        >
                            {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                    )}
                </div>

                {isUrl(clip.content.trim()) && <LinkPreview url={clip.content.trim()} />}

                <p className="text-[10px] text-black/30 mt-3 font-medium">
                    {new Date(clip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •
                    {new Date(clip.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                </p>
            </div>

            <div className="flex items-center gap-1 transition-all shrink-0 self-end sm:self-center">
                {isUrl(clip.content) && (
                    <a
                        href={clip.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
                <button
                    onClick={() => handleCopy(clip.id, clip.content)}
                    className={cn(
                        "p-2 rounded-lg transition-all",
                        copiedId === clip.id ? "text-emerald-500 bg-emerald-50" : "text-black/40 hover:bg-black/5"
                    )}
                >
                    {copiedId === clip.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => handleDelete(clip.id)}
                    className="p-2 text-black/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
