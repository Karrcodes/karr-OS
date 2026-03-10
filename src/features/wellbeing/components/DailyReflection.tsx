'use client'

import * as React from 'react'
import { useState } from 'react'
import { useWellbeing } from '../contexts/WellbeingContext'
import { Reflection } from '../types'
import { Sparkles, Save, Calendar, ChevronRight, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function DailyReflection() {
    const { reflections, saveReflection } = useWellbeing()
    const [content, setContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [viewHistory, setViewHistory] = useState(false)

    const today = new Date().toISOString().split('T')[0]
    const todayReflection = reflections.find((r: Reflection) => r.date === today)

    const handleSave = async () => {
        if (!content.trim()) return
        setIsSaving(true)
        // Simulate a small delay for premium feel
        await new Promise(resolve => setTimeout(resolve, 600))
        saveReflection(content)
        setContent('')
        setIsSaving(false)
    }

    return (
        <div className="bg-black text-white rounded-[40px] p-8 space-y-8 relative overflow-hidden group">
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-12 h-12" />
            </div>

            <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                    <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">Internal Protocol</h3>
                    <h2 className="text-3xl font-black uppercase tracking-tighter tracking-tight leading-none">Daily Reflection</h2>
                </div>
                <button
                    onClick={() => setViewHistory(!viewHistory)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                    <Calendar className="w-3 h-3" />
                    History
                </button>
            </div>

            <AnimatePresence mode="wait">
                {viewHistory ? (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4 min-h-[220px]"
                    >
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {reflections.length === 0 ? (
                                <p className="text-white/20 text-[11px] font-bold uppercase text-center py-10 tracking-widest">No entries recorded</p>
                            ) : (
                                reflections.map((ref) => (
                                    <div key={ref.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{ref.date}</span>
                                            <Quote className="w-3 h-3 text-white/10" />
                                        </div>
                                        <p className="text-[13px] text-white/70 font-medium leading-relaxed italic">"{ref.content}"</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="entry"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {todayReflection ? (
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                                <p className="text-[13px] text-white/80 font-medium leading-relaxed italic">"{todayReflection.content}"</p>
                                <div className="flex items-center gap-2 pt-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3" />
                                    Protocol Logged for Today
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <textarea
                                        placeholder="What's a win from today? Or any thoughts on your progress..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-[15px] font-medium placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/40 min-h-[140px] resize-none leading-relaxed"
                                    />
                                    <Quote className="absolute top-6 right-6 w-6 h-6 text-white/5" />
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={!content.trim() || isSaving}
                                    className={cn(
                                        "w-full py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3",
                                        isSaving ? "bg-white/20 text-white/40 cursor-wait" : "bg-white text-black hover:scale-[1.01] active:scale-[0.99]"
                                    )}
                                >
                                    {isSaving ? 'Synchronizing...' : (
                                        <>
                                            Save Protocol
                                            <Save className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                        <p className="text-[10px] font-medium text-white/20 text-center uppercase tracking-widest">Reflections help identify patterns in performance and wellbeing.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
