'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, BrainCircuit } from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function KarrAIChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hey, I'm KarrAI — your financial co-pilot. Ask me anything about your pockets, debts, or goals. I have live access to your data.",
        },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
    }, [messages])

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const userMsg: Message = { role: 'user', content: input.trim() }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
            })

            const data = await res.json()
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.reply ?? 'Something went wrong. Check your Gemini API key.',
                },
            ])
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Network error. Please try again.' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    return (
        <div className="flex flex-col h-full min-h-[400px]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#7c3aed]/10 border border-[#7c3aed]/15 flex items-center justify-center">
                    <BrainCircuit className="w-3.5 h-3.5 text-[#7c3aed]" />
                </div>
                <div>
                    <p className="text-[13px] font-semibold text-black/90">KarrAI</p>
                    <p className="text-[10px] text-black/35">Financial Co-pilot · Powered by Gemini</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-black/30">Live</span>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[340px] scroll-smooth"
            >
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div
                            className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'assistant'
                                ? 'bg-[#7c3aed]/10 border border-[#7c3aed]/15'
                                : 'bg-black/[0.06]'
                                }`}
                        >
                            {msg.role === 'assistant'
                                ? <Bot className="w-3 h-3 text-[#7c3aed]" />
                                : <User className="w-3 h-3 text-black/50" />
                            }
                        </div>
                        <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${msg.role === 'assistant'
                                ? 'bg-black/[0.03] border border-black/[0.06] text-black/75'
                                : 'bg-[#7c3aed]/10 border border-[#7c3aed]/15 text-black/85'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/15 flex items-center justify-center">
                            <Bot className="w-3 h-3 text-[#7c3aed]" />
                        </div>
                        <div className="bg-black/[0.03] border border-black/[0.06] rounded-xl px-3 py-2">
                            <Loader2 className="w-3.5 h-3.5 text-black/30 animate-spin" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex gap-2 mt-3">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask KarrAI anything..."
                    className="flex-1 bg-black/[0.03] border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-black/90 placeholder-black/25 outline-none focus:border-[#7c3aed]/40 transition-colors"
                />
                <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center hover:bg-[#7c3aed]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-3.5 h-3.5 text-[#7c3aed]" />
                </button>
            </div>
        </div>
    )
}
