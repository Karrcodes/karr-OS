'use client'

import React from 'react'
import { useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { MoodTracker } from './MoodTracker'
import { DailyReflection } from './DailyReflection'
import { Heart, Brain, Moon, Sun, Wind, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export function MindTab() {
    return (
        <div className="space-y-10">
            {/* Mind Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-rose-500 rounded-[32px] p-8 text-white space-y-4 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                    <Heart className="w-8 h-8 text-rose-200" />
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Emotional Baseline</h3>
                        <p className="text-rose-100/60 text-[12px] font-medium leading-relaxed uppercase tracking-tight">Status: Balanced</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">7.8</span>
                        <span className="text-[13px] font-bold text-rose-100/40 uppercase">Avg Mood</span>
                    </div>
                </div>

                <div className="bg-black rounded-[32px] p-8 text-white space-y-4 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
                    <Moon className="w-8 h-8 text-indigo-400" />
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Sleep Quality</h3>
                        <p className="text-white/40 text-[12px] font-medium leading-relaxed uppercase tracking-tight">Last Night: Deep</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">8.2</span>
                        <span className="text-[13px] font-bold text-white/20 uppercase">Hours</span>
                    </div>
                </div>

                <div className="bg-emerald-600 rounded-[32px] p-8 text-white space-y-4 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
                    <Wind className="w-8 h-8 text-emerald-200" />
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Mindfulness</h3>
                        <p className="text-emerald-100/60 text-[12px] font-medium leading-relaxed uppercase tracking-tight">Daily Streak: 5 Days</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">15</span>
                        <span className="text-[13px] font-bold text-emerald-100/40 uppercase">Mins Total</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <MoodTracker />
                <DailyReflection />
            </div>

            {/* Mindfulness Toolkit */}
            <div className="bg-white border border-black/5 rounded-[40px] p-10 space-y-8">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-rose-500" />
                    <h3 className="text-[13px] font-black text-black/30 uppercase tracking-[0.4em]">Mindfulness Toolkit</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: 'Box Breathing', icon: Wind, color: 'text-blue-500', bg: 'bg-blue-50', time: '4 Mins' },
                        { title: 'Inner Reflection', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50', time: '10 Mins' },
                        { title: 'Sun Gaze', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50', time: '5 Mins' },
                    ].map((tool, i) => (
                        <button key={tool.title} className="flex flex-col items-center gap-6 p-8 rounded-[32px] bg-black/[0.02] border border-black/5 hover:bg-black uppercase group transition-all">
                            <div className={cn("p-6 rounded-3xl transition-transform group-hover:scale-110", tool.bg)}>
                                <tool.icon className={cn("w-8 h-8", tool.color)} />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-[14px] font-black group-hover:text-white">{tool.title}</p>
                                <p className="text-[10px] font-black text-black/30 tracking-widest group-hover:text-white/40">{tool.time}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
