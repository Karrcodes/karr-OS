'use client'

import { useState, useEffect, useRef } from 'react'
import { Brain, Terminal, Send, RefreshCw, Sparkles, Database, Shield, Zap } from 'lucide-react'
import { KarrFooter } from '@/components/KarrFooter'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function IntelligencePage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Karr Intelligence Node Active. OS Data synchronised. How shall we optimise your trajectory today?",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isSynced, setIsSynced] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('sync') === 'success') {
            setIsSynced(true)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "DECRYPTION_SUCCESS: Google Drive neural link established. I can now query your external documentation repositories.",
                timestamp: new Date()
            }])
        }
    }, [])

    // ... handleSend (unchanged logic, just add streaming effect on return) ...

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isTyping])

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isTyping) return

        const userMsg: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        }

        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')
        setIsTyping(true)

        try {
            const res = await fetch('/api/ai/intelligence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            })

            const data = await res.json()
            if (data.reply) {
                const assistantMsg: Message = {
                    role: 'assistant',
                    content: data.reply,
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMsg])
            } else {
                throw new Error(data.error || 'Failed to fetch response')
            }
        } catch (err: any) {
            const errorMsg: Message = {
                role: 'assistant',
                content: `ERROR: SYSTEM_HALT. ${err.message}. Connection to Intelligence Node severed.`,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsTyping(false)
        }
    }


    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-black/[0.06] px-6 py-4 z-20 shadow-sm shrink-0">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shadow-lg">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[18px] font-bold text-black tracking-tight flex items-center gap-2">
                                Karr Intelligence
                                <span className="bg-emerald-500/10 text-emerald-600 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-widest border border-emerald-500/20">Core v1.0</span>
                            </h1>
                            <p className="text-[11px] text-black/35 font-mono uppercase tracking-wider mt-0.5">Secure Neural Link Established</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            OS Sync: 100%
                        </div>
                        <div className="flex items-center gap-1.5 text-black/30">
                            {isSynced ? (
                                <div className="flex items-center gap-1.5 text-blue-500">
                                    <Database className="w-3 h-3" /> Drive Online
                                </div>
                            ) : (
                                <button
                                    onClick={() => window.location.href = '/api/auth/google'}
                                    className="flex items-center gap-1.5 hover:text-black transition-colors"
                                >
                                    <Database className="w-3 h-3" /> Sync Drive
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Terminal Viewport */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 bg-black relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full pb-8 pt-4 custom-scrollbar"
                >
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex flex-col gap-2 max-w-[85%]",
                                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {msg.role === 'assistant' ? (
                                        <>
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                                                <Terminal className="w-3 h-3 text-emerald-500" />
                                            </div>
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">Karr_Intelligence_Node</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">Admin_Terminal</span>
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                                                <Zap className="w-3 h-3 text-emerald-400" />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className={cn(
                                    "p-4 rounded-2xl text-[14px] md:text-[15px] font-mono leading-relaxed border shadow-2xl transition-all",
                                    msg.role === 'assistant'
                                        ? "bg-[#0a0a0a] text-white border-white/10"
                                        : "bg-emerald-500 text-black border-emerald-400 font-bold"
                                )}>
                                    {msg.role === 'assistant' && <span className="text-emerald-500 mr-2">$</span>}
                                    {msg.content}
                                </div>
                                <span className="text-[9px] font-mono text-white/20 mt-1 uppercase">
                                    [{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <div className="flex flex-col gap-2 items-start max-w-[85%]">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-white/5">
                                    <Terminal className="w-3 h-3 text-emerald-500" />
                                </div>
                                <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">Processing...</span>
                            </div>
                            <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-2xl flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="shrink-0 max-w-4xl mx-auto w-full pb-4 px-2">
                    <form
                        onSubmit={handleSend}
                        className="relative group bg-[#0a0a0a] border-2 border-white/10 rounded-2xl p-1 shadow-2xl transition-all focus-within:border-emerald-500/50"
                    >
                        <div className="flex items-center">
                            <div className="pl-4 pr-3 text-emerald-500 font-mono font-bold select-none cursor-default">
                                λ
                            </div>
                            <input
                                autoFocus
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Execute KarrOS directive..."
                                className="w-full bg-transparent border-none focus:ring-0 text-white font-mono text-[15px] py-4 placeholder:text-white/20"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className={cn(
                                    "mr-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                    input.trim() && !isTyping
                                        ? "bg-emerald-500 text-black hover:scale-105 active:scale-95"
                                        : "bg-white/5 text-white/20 cursor-not-allowed"
                                )}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                    <div className="mt-3 flex items-center justify-between px-2">
                        <div className="flex gap-4">
                            <span className="text-[9px] font-mono text-white/20 uppercase cursor-help hover:text-white/40">/help</span>
                            <span className="text-[9px] font-mono text-white/20 uppercase cursor-help hover:text-white/40">/scan-finances</span>
                            <span className="text-[9px] font-mono text-white/20 uppercase cursor-help hover:text-white/40">/sync-drive</span>
                        </div>
                        <p className="text-[9px] font-mono text-white/10 uppercase tracking-widest">Auth_Level: Elevated</p>
                    </div>
                </div>
            </div>

            <KarrFooter dark />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    )
}
