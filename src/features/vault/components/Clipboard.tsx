'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useVault } from '../contexts/VaultContext'
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
    const { isVaultPrivate } = useVault()
    const [clips, setClips] = useState<Clip[]>([])
    const [newClip, setNewClip] = useState('')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const { settings } = useSystemSettings()

    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        id: string | null;
    }>({
        open: false,
        title: '',
        message: '',
        id: null
    })

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
        setConfirmModal(prev => ({ ...prev, open: false }))
    }

    const handleCopy = (id: string, content: string) => {
        navigator.clipboard.writeText(content)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleCancel = () => {
        setNewClip('')
    }

    const extractFirstUrl = (str: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/
        const match = str.match(urlRegex)
        // Clean up punctuation at the end of URL that might have been caught
        if (match) {
            return match[0].replace(/[.,!?;:)]+$/, '')
        }
        return null
    }

    const isBulletLine = (text: string) => {
        const lines = text.split('\n')
        const lastLine = lines[lines.length - 1]
        return lastLine.trim().startsWith('- ') || lastLine.trim().startsWith('* ')
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
                        } else if (e.key === 'Enter' && !e.shiftKey) {
                            const textarea = e.currentTarget
                            const start = textarea.selectionStart
                            const text = textarea.value
                            const linesBefore = text.substring(0, start).split('\n')
                            const currentLine = linesBefore[linesBefore.length - 1]

                            if (currentLine.trim().startsWith('- ')) {
                                e.preventDefault()
                                if (currentLine.trim() === '- ') {
                                    // Empty bullet - clear it and exit mode
                                    const before = text.substring(0, start - currentLine.length)
                                    const after = text.substring(start)
                                    setNewClip(before + after)
                                } else {
                                    // Continune bullet
                                    const before = text.substring(0, start)
                                    const after = text.substring(start)
                                    setNewClip(before + '\n- ' + after)
                                    // Selection needs to be handled via timeout
                                    setTimeout(() => {
                                        textarea.selectionStart = textarea.selectionEnd = start + 3
                                    }, 0)
                                }
                            }
                        }
                    }}
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
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
                                const bulleted = selected.split('\n').map(line => line.trim().startsWith('- ') ? line : `- ${line}`).join('\n')
                                setNewClip(before + bulleted + after)
                            } else {
                                // Just insert bullet at cursor or before selection
                                setNewClip(before + (selected.trim().startsWith('- ') ? selected : `- ${selected}`) + after)
                            }
                        }}
                        className={cn(
                            "p-1.5 rounded-lg transition-all",
                            isBulletLine(newClip) ? "text-blue-500 bg-blue-50" : "text-black/40 hover:text-black hover:bg-black/5"
                        )}
                        title="Add bullet points"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    {newClip.trim() && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-[11px] font-bold text-black/40 hover:text-red-500 px-2 py-1 underline underline-offset-2 transition-colors uppercase tracking-tight"
                        >
                            Cancel
                        </button>
                    )}
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

            {/* Confirmation Modal */}
            {confirmModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-black/5 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-[18px] font-black text-black mb-2">{confirmModal.title}</h3>
                        <p className="text-[14px] text-black/50 leading-relaxed mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                                className="flex-1 px-4 py-3 rounded-2xl bg-black/[0.03] text-black font-bold text-[14px] hover:bg-black/[0.06] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmModal.id && handleDelete(confirmModal.id)}
                                className="flex-1 px-4 py-3 rounded-2xl bg-red-500 text-white font-bold text-[14px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            setConfirmModal={setConfirmModal}
                            extractFirstUrl={extractFirstUrl}
                            isVaultPrivate={isVaultPrivate}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
function ClipItem({ clip, copiedId, handleCopy, setConfirmModal, extractFirstUrl, isVaultPrivate }: {
    clip: Clip,
    copiedId: string | null,
    handleCopy: (id: string, content: string) => void,
    setConfirmModal: React.Dispatch<React.SetStateAction<{
        open: boolean;
        title: string;
        message: string;
        id: string | null;
    }>>,
    extractFirstUrl: (str: string) => string | null,
    isVaultPrivate: boolean
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
                        <div className={cn(isVaultPrivate && "privacy-blur")}>
                            {clip.content.split('\n').map((line, i) => {
                                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                                    return (
                                        <div key={i} className="flex gap-2 mb-1 pl-1">
                                            <span className="text-black/30 mt-1.5 w-1 h-1 rounded-full bg-black/40 shrink-0" />
                                            <span>{line.trim().substring(2)}</span>
                                        </div>
                                    )
                                }
                                const url = extractFirstUrl(line)
                                if (url) {
                                    return (
                                        <p key={i} className="mb-1 text-blue-600 font-medium underline underline-offset-4 decoration-blue-200 break-all">
                                            {line}
                                        </p>
                                    )
                                }
                                return (
                                    <p key={i} className="mb-1">
                                        {line}
                                    </p>
                                )
                            })}
                        </div>
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

                {!isVaultPrivate && extractFirstUrl(clip.content) && <LinkPreview url={extractFirstUrl(clip.content)!} />}

                <p className="text-[10px] text-black/30 mt-3 font-medium">
                    {new Date(clip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •
                    {new Date(clip.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                </p>
            </div>

            <div className="flex items-center gap-1 transition-all shrink-0 self-end sm:self-center">
                {!isVaultPrivate && extractFirstUrl(clip.content) && (
                    <a
                        href={extractFirstUrl(clip.content)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
                {!isVaultPrivate && (
                    <button
                        onClick={() => handleCopy(clip.id, clip.content)}
                        className={cn(
                            "p-2 rounded-lg transition-all",
                            copiedId === clip.id ? "text-emerald-500 bg-emerald-50" : "text-black/40 hover:bg-black/5"
                        )}
                    >
                        {copiedId === clip.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                )}
                <button
                    onClick={() => setConfirmModal({
                        open: true,
                        title: 'Delete Clip?',
                        message: 'Are you sure you want to remove this item from your vault? This cannot be undone.',
                        id: clip.id
                    })}
                    className="p-2 text-black/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
