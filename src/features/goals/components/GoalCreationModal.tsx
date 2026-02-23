'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Plus,
    Target,
    Calendar,
    Briefcase,
    Heart,
    User,
    Wallet,
    AlertCircle,
    Trash2,
    Check,
    ArrowRight,
    Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalCategory, GoalPriority, CreateGoalData } from '../types/goals.types'

interface GoalCreationModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: CreateGoalData) => Promise<void>
}

const CATEGORIES: { value: GoalCategory, label: string, icon: any }[] = [
    { value: 'personal', label: 'Personal', icon: User },
    { value: 'finance', label: 'Finance', icon: Wallet },
    { value: 'career', label: 'Career', icon: Briefcase },
    { value: 'health', label: 'Health', icon: Heart },
]

const PRIORITIES: { value: GoalPriority, label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'mid', label: 'Mid' },
    { value: 'high', label: 'High' },
    { value: 'super', label: 'Super' },
]

export default function GoalCreationModal({ isOpen, onClose, onSave }: GoalCreationModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState<GoalCategory>('personal')
    const [priority, setPriority] = useState<GoalPriority>('mid')
    const [timeframe, setTimeframe] = useState<'short' | 'medium' | 'long'>('short')
    const [visionImageUrl, setVisionImageUrl] = useState('')
    const [targetDate, setTargetDate] = useState('')
    const [milestones, setMilestones] = useState<string[]>([''])
    const [loading, setLoading] = useState(false)

    const addMilestone = () => setMilestones([...milestones, ''])
    const removeMilestone = (index: number) => {
        if (milestones.length === 1) {
            setMilestones([''])
            return
        }
        setMilestones(milestones.filter((_, i) => i !== index))
    }
    const updateMilestone = (index: number, value: string) => {
        const newMilestones = [...milestones]
        newMilestones[index] = value
        setMilestones(newMilestones)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || loading) return

        setLoading(true)
        try {
            await onSave({
                title,
                description,
                category,
                priority,
                timeframe,
                vision_image_url: visionImageUrl || undefined,
                target_date: targetDate || undefined,
                milestones: milestones.filter(m => m.trim() !== '')
            })
            // Reset and close
            setTitle('')
            setDescription('')
            setVisionImageUrl('')
            setMilestones([''])
            onClose()
        } catch (err) {
            console.error('Failed to save goal:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-black/5 flex items-center justify-between shrink-0 bg-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg shadow-black/10">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-[22px] font-bold text-black tracking-tight">Define New Objective</h2>
                                    <p className="text-[12px] text-black/35 font-medium">Strategic Tactical Layer</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full border border-black/5 flex items-center justify-center hover:bg-black/5 transition-colors group"
                            >
                                <X className="w-5 h-5 text-black/40 group-hover:text-black transition-colors" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                            {/* Title & Description */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-black/40 uppercase tracking-widest ml-1">Goal Designation</label>
                                    <input
                                        autoFocus
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. Apartment Deposit"
                                        className="w-full text-[28px] font-bold tracking-tight placeholder:text-black/5 border-none p-0 focus:ring-0"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-black/40 uppercase tracking-widest ml-1">Mission Brief</label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Detailed description of the target state..."
                                        className="w-full text-sm font-medium text-black/60 placeholder:text-black/10 border-none p-0 focus:ring-0 resize-none min-h-[80px]"
                                    />
                                </div>
                            </div>

                            {/* Configuration Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-black/5">
                                {/* Left Side: Category & Timeframe */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold text-black/40 uppercase tracking-widest ml-1">Module Alignment</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {CATEGORIES.map(cat => {
                                                const Icon = cat.icon
                                                const active = category === cat.value
                                                return (
                                                    <button
                                                        key={cat.value}
                                                        type="button"
                                                        onClick={() => setCategory(cat.value)}
                                                        className={cn(
                                                            "flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all text-sm font-bold",
                                                            active
                                                                ? "bg-black text-white border-black"
                                                                : "bg-white border-black/5 text-black/40 hover:border-black/20"
                                                        )}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        {cat.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold text-black/40 uppercase tracking-widest ml-1">Strategic Horizon</label>
                                        <div className="flex items-center gap-1.5 p-1 bg-black/5 rounded-2xl">
                                            {(['short', 'medium', 'long'] as const).map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setTimeframe(t)}
                                                    className={cn(
                                                        "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all",
                                                        timeframe === t ? "bg-white text-black shadow-sm" : "text-black/30 hover:text-black/60"
                                                    )}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Priority & Date & Image */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold text-black/40 uppercase tracking-widest ml-1">Tier Priority</label>
                                        <div className="flex items-center gap-1.5 p-1 bg-black/5 rounded-2xl">
                                            {PRIORITIES.map(p => (
                                                <button
                                                    key={p.value}
                                                    type="button"
                                                    onClick={() => setPriority(p.value)}
                                                    className={cn(
                                                        "flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all",
                                                        priority === p.value ? "bg-white text-black shadow-sm" : "text-black/30 hover:text-black/60"
                                                    )}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold text-black/40 uppercase tracking-widest ml-1">Target Deadline</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                            <input
                                                type="date"
                                                value={targetDate}
                                                onChange={e => setTargetDate(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-black/5 text-sm font-bold focus:border-black/20 focus:bg-white bg-black/[0.02] transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold text-black/40 uppercase tracking-widest ml-1">Vision Image URL</label>
                                        <div className="relative group">
                                            <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                            <input
                                                type="text"
                                                value={visionImageUrl}
                                                onChange={e => setVisionImageUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-black/5 text-sm font-bold focus:border-black/20 focus:bg-white bg-black/[0.02] transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Milestone Builder */}
                            <div className="space-y-6 pt-6 border-t border-black/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[11px] font-bold text-black/40 uppercase tracking-widest ml-1">Milestone Breakdown</label>
                                        <div className="bg-emerald-100 text-emerald-600 rounded px-1.5 py-0.5 text-[10px] font-bold">
                                            {milestones.filter(m => m.trim() !== '').length}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addMilestone}
                                        className="text-[11px] font-bold text-black hover:text-black/60 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Step
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {milestones.map((milestone, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-2 group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-black text-black/20 shrink-0">
                                                {idx + 1}
                                            </div>
                                            <input
                                                value={milestone}
                                                onChange={e => updateMilestone(idx, e.target.value)}
                                                placeholder={`Milestone ${idx + 1}...`}
                                                className="flex-1 bg-white border border-black/5 rounded-2xl px-5 py-3 text-sm font-bold focus:border-black/20 focus:ring-4 focus:ring-black/5 transition-all outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeMilestone(idx)}
                                                className="w-10 h-10 flex items-center justify-center text-black/10 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </form>

                        {/* Footer / Submit */}
                        <div className="p-8 border-t border-black/5 bg-black/[0.01] flex items-center justify-between shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-4 text-sm font-bold text-black/30 hover:text-black transition-colors"
                            >
                                Discard Changes
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!title.trim() || loading}
                                className={cn(
                                    "flex items-center gap-3 px-10 py-5 bg-black text-white rounded-2xl font-bold tracking-tight text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-black/20",
                                    (!title.trim() || loading) && "opacity-20 grayscale cursor-not-allowed"
                                )}
                            >
                                {loading ? 'Initializing...' : (
                                    <>
                                        Authorize Mission
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
