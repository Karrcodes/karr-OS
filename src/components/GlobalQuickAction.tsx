'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, CheckSquare, Clipboard, Loader2, Sparkles, ListChecks, Calendar, Info, Clock, Heart, Briefcase, User, Beaker, Factory, Tv, TrendingUp, Building2, User2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

type ActionType = 'task' | 'vault' | null

const PERSONAL_STRATEGIC = [
    { id: 'finance', label: 'Finance', icon: Heart, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'career', label: 'Career', icon: Briefcase, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { id: 'health', label: 'Health', icon: Heart, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    { id: 'personal', label: 'Personal', icon: User, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
] as const

const BUSINESS_STRATEGIC = [
    { id: 'rnd', label: 'R&D', icon: Beaker, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { id: 'production', label: 'Production', icon: Factory, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    { id: 'media', label: 'Media', icon: Tv, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    { id: 'growth', label: 'Growth', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
] as const

const PRIORITY_OPTS = [
    { id: 'urgent', label: 'Urgent', color: 'bg-purple-600' },
    { id: 'high', label: 'High', color: 'bg-orange-500' },
    { id: 'mid', label: 'Mid', color: 'bg-yellow-500' },
    { id: 'low', label: 'Low', color: 'bg-zinc-500' },
] as const

export function GlobalQuickAction() {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [activeAction, setActiveAction] = useState<ActionType>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Form States
    const [form, setForm] = useState({
        taskTitle: '',
        taskProfile: 'personal' as 'personal' | 'business',
        taskCategory: 'todo' as 'todo' | 'grocery' | 'reminder',
        taskPriority: 'mid' as 'urgent' | 'high' | 'mid' | 'low',
        strategicCategory: 'personal' as string,
        dueDate: '',
        dueDateMode: 'none' as 'none' | 'on' | 'before' | 'range',
        endDate: '',
        taskDuration: '30',
        taskImpact: '5',
        vaultText: ''
    })
    const [showTaskExtras, setShowTaskExtras] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const resetForm = () => {
        setForm({
            taskTitle: '',
            taskProfile: 'personal',
            taskCategory: 'todo',
            taskPriority: 'mid',
            strategicCategory: 'personal',
            dueDate: '',
            dueDateMode: 'none',
            endDate: '',
            taskDuration: '30',
            taskImpact: '5',
            vaultText: ''
        })
        setShowTaskExtras(false)
        setSuccess(false)
        setLoading(false)
    }

    const toggleMenu = () => {
        if (activeAction) {
            setActiveAction(null)
            resetForm()
        } else {
            setIsOpen(!isOpen)
        }
    }

    const handleSubmit = async () => {
        if (loading || success) return
        setLoading(true)
        try {
            if (activeAction === 'task') {
                if (!form.taskTitle.trim()) throw new Error('Task title required')
                const { error } = await supabase.from('fin_tasks').insert({
                    title: form.taskTitle,
                    category: form.taskCategory,
                    priority: form.taskPriority,
                    strategic_category: form.strategicCategory,
                    due_date: form.dueDateMode !== 'none' ? form.dueDate || null : null,
                    due_date_mode: form.dueDateMode !== 'none' ? form.dueDateMode : null,
                    end_date: form.dueDateMode === 'range' ? form.endDate || null : null,
                    estimated_duration: parseInt(form.taskDuration),
                    impact_score: parseInt(form.taskImpact),
                    profile: form.taskProfile,
                    is_completed: false,
                    position: Date.now() // Simple position for quick task
                })
                if (error) throw error
            } else if (activeAction === 'vault') {
                if (!form.vaultText.trim()) throw new Error('Note required')
                const { error } = await supabase.from('sys_clipboard').insert({
                    content: form.vaultText.trim(),
                    profile: 'personal'
                })
                if (error) throw error
            }

            setSuccess(true)
            setTimeout(() => {
                setActiveAction(null)
                setIsOpen(false)
                resetForm()
            }, 1200)
        } catch (err) {
            console.error(err)
            alert('Failed to save action')
        } finally {
            setLoading(false)
        }
    }

    const actions = useMemo(() => [
        { id: 'task', label: 'Task', icon: CheckSquare, color: 'bg-violet-600', glow: 'shadow-violet-600/40' },
        { id: 'vault', label: 'Vault', icon: Clipboard, color: 'bg-amber-500', glow: 'shadow-amber-500/40' },
    ], [])

    // Early return for SSR and excluded routes AFTER all hook calls
    if (!mounted || pathname === '/intelligence') return null

    // Radial Positioning constants
    const radius = 90
    const startAngle = 180
    const endAngle = 270
    // If only one action, it should be at the center of the arc, but here we have at least 2 usually.
    // If we have 2, angleStep will be 90.
    const angleStep = actions.length > 1 ? (endAngle - startAngle) / (actions.length - 1) : 0

    // Shared UI classes for absolute symmetry
    const inputHeight = "h-[48px]"
    const inputBase = cn(inputHeight, "w-full bg-black/[0.03] border border-black/5 rounded-2xl px-4 text-[13px] font-bold outline-none transition-all flex items-center box-border focus:ring-4 focus:ring-black/5 focus:border-black/10")

    return (
        <div
            className="fixed bottom-6 right-6 md:right-8 z-[300] flex flex-col items-end pointer-events-none"
            style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
            {/* Action Popup Context - Portaled for full screen centering */}
            <AnimatePresence>
                {activeAction && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="bg-white/95 backdrop-blur-3xl rounded-[32px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.4)] border border-black/5 overflow-hidden flex flex-col w-full max-w-[400px] pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between bg-white/40">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg", actions.find(a => a.id === activeAction)?.color)}>
                                        {actions.find(a => a.id === activeAction)?.icon && React.createElement(actions.find(a => a.id === activeAction)!.icon, { className: "w-4 h-4" })}
                                    </div>
                                    <h3 className="text-[15px] font-black text-black uppercase tracking-tighter">
                                        Quick {activeAction}
                                    </h3>
                                </div>
                                <button onClick={() => setActiveAction(null)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
                                {activeAction === 'task' && (
                                    <>
                                        {/* Primary Input - Title is top of the hierarchy again */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Deployment Title</label>
                                                <div className="flex gap-1 bg-black/[0.04] p-0.5 rounded-lg">
                                                    {(['personal', 'business'] as const).map(p => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setForm({
                                                                ...form,
                                                                taskProfile: p,
                                                                strategicCategory: p === 'personal' ? 'personal' : 'rnd'
                                                            })}
                                                            className={cn(
                                                                "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                                                                form.taskProfile === p
                                                                    ? "bg-white text-black shadow-sm"
                                                                    : "text-black/30 hover:text-black/50"
                                                            )}
                                                        >
                                                            {p === 'personal' ? <User2 className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <input
                                                autoFocus
                                                value={form.taskTitle}
                                                onFocus={() => setShowTaskExtras(true)}
                                                onClick={() => setShowTaskExtras(true)}
                                                onChange={e => {
                                                    setForm({ ...form, taskTitle: e.target.value })
                                                    if (!showTaskExtras) setShowTaskExtras(true)
                                                }}
                                                placeholder="Action item details..."
                                                className={cn(inputBase, "text-[16px] font-black bg-black/[0.03] placeholder:text-black/10 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/20 py-6 h-[56px] w-full")}
                                            />
                                        </div>

                                        <AnimatePresence>
                                            {showTaskExtras && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-4 overflow-hidden"
                                                >
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Operation Type</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {(['todo', 'grocery', 'reminder'] as const).map(cat => (
                                                                <button
                                                                    key={cat}
                                                                    type="button"
                                                                    onClick={() => setForm({ ...form, taskCategory: cat })}
                                                                    className={cn(
                                                                        "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                                                        form.taskCategory === cat
                                                                            ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                                                                            : "bg-black/[0.02] text-black/40 border-black/5 hover:bg-black/[0.05]"
                                                                    )}
                                                                >
                                                                    {cat}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Criticality</label>
                                                            <div className="flex gap-1.5 items-center flex-wrap py-1">
                                                                {PRIORITY_OPTS.map(p => (
                                                                    <button
                                                                        key={p.id}
                                                                        type="button"
                                                                        onClick={() => setForm({ ...form, taskPriority: p.id as any })}
                                                                        className={cn(
                                                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all border shrink-0",
                                                                            form.taskPriority === p.id
                                                                                ? cn(p.color, "text-white border-transparent shadow-md scale-105")
                                                                                : "bg-black/[0.03] text-black/40 border-black/5 hover:bg-black/[0.06]"
                                                                        )}
                                                                    >
                                                                        {p.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 flex-1 min-w-0">
                                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Timeline</label>
                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                {(['none', 'on', 'before', 'range'] as const).map(mode => (
                                                                    <button
                                                                        key={mode}
                                                                        type="button"
                                                                        onClick={() => setForm({ ...form, dueDateMode: mode })}
                                                                        className={cn(
                                                                            "px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-tighter border transition-all",
                                                                            form.dueDateMode === mode
                                                                                ? "bg-black text-white border-black"
                                                                                : "bg-black/[0.02] text-black/40 border-black/5"
                                                                        )}
                                                                    >
                                                                        {mode}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {form.dueDateMode !== 'none' && (
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {form.dueDateMode === 'range' && <span className="text-[9px] font-black text-black/20 uppercase w-8">Start</span>}
                                                                        <div className={cn(inputBase, "relative flex-1 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/20 h-[42px] py-0")}>
                                                                            <input
                                                                                type="date"
                                                                                value={form.dueDate}
                                                                                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                                                                className="w-full bg-transparent border-none outline-none py-2 text-[12px] font-bold"
                                                                                style={{ minWidth: 0 }}
                                                                            />
                                                                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20 pointer-events-none" />
                                                                        </div>
                                                                    </div>
                                                                    {form.dueDateMode === 'range' && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[9px] font-black text-black/20 uppercase w-8">End</span>
                                                                            <div className={cn(inputBase, "relative flex-1 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/20 h-[42px] py-0")}>
                                                                                <input
                                                                                    type="date"
                                                                                    value={form.endDate}
                                                                                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                                                                                    className="w-full bg-transparent border-none outline-none py-2 text-[12px] font-bold"
                                                                                    style={{ minWidth: 0 }}
                                                                                />
                                                                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20 pointer-events-none" />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Duration</label>
                                                            <div className="relative">
                                                                <select
                                                                    value={form.taskDuration}
                                                                    onChange={e => setForm({ ...form, taskDuration: e.target.value })}
                                                                    className={cn(inputBase, "appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10")}
                                                                >
                                                                    {Array.from({ length: 16 }, (_, i) => (i + 1) * 15).map(mins => (
                                                                        <option key={mins} value={mins}>
                                                                            {mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}` : `${mins}m`}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Impact ({form.taskImpact}/10)</label>
                                                            <div className="flex items-center gap-3 bg-black/[0.03] border border-black/5 rounded-2xl px-4 py-2 h-[48px]">
                                                                <input
                                                                    type="range"
                                                                    min="1"
                                                                    max="10"
                                                                    value={form.taskImpact}
                                                                    onChange={e => setForm({ ...form, taskImpact: e.target.value })}
                                                                    className="flex-1 accent-indigo-500 h-1 bg-black/10 rounded-lg appearance-none cursor-pointer"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Strategic Alignment</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {(form.taskProfile === 'personal' ? PERSONAL_STRATEGIC : BUSINESS_STRATEGIC).map(strat => (
                                                                <button
                                                                    key={strat.id}
                                                                    type="button"
                                                                    onClick={() => setForm({ ...form, strategicCategory: strat.id as any })}
                                                                    className={cn(
                                                                        "px-3 py-2.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2",
                                                                        form.strategicCategory === strat.id
                                                                            ? strat.color
                                                                            : "bg-black/[0.02] border-black/5 text-black/40 hover:bg-black/[0.04]"
                                                                    )}
                                                                >
                                                                    <strat.icon className={cn("w-3.5 h-3.5", form.strategicCategory === strat.id ? strat.color.split(' ')[0] : "text-black/10")} />
                                                                    {strat.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                )}

                                {activeAction === 'vault' && (
                                    <div className="space-y-4">
                                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3">
                                            <Info className="w-5 h-5 text-amber-500 shrink-0" />
                                            <p className="text-[11px] font-medium text-amber-900/60 leading-relaxed">
                                                Vault assets are saved to your global system clipboard for cross-device retrieval.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Asset Transfer</label>
                                            <textarea
                                                autoFocus
                                                value={form.vaultText}
                                                onChange={e => setForm({ ...form, vaultText: e.target.value })}
                                                placeholder="Secure message or link..."
                                                className="w-full h-40 bg-black/[0.03] border border-black/5 rounded-2xl px-4 py-4 text-[14px] font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/20 transition-all resize-none no-scrollbar"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || success}
                                        className={cn(
                                            "w-full py-5 rounded-2xl text-white font-black text-[14px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 overflow-hidden relative group",
                                            success ? "bg-emerald-500" :
                                                actions.find(a => a.id === activeAction)?.color,
                                            (loading || success) && "opacity-80 scale-[0.98]"
                                        )}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                                success ? <><ListChecks className="w-5 h-5" /> Authorized</> :
                                                    <><Sparkles className="w-4 h-4" /> Finalize Operation</>}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="relative w-16 h-16 flex items-center justify-center pointer-events-none">
                <AnimatePresence>
                    {isOpen && !activeAction && (
                        <>
                            {actions.map((action, i) => {
                                const angle = startAngle + i * angleStep
                                const radian = (angle * Math.PI) / 180
                                const tx = radius * Math.cos(radian)
                                const ty = radius * Math.sin(radian)

                                return (
                                    <motion.button
                                        key={action.id}
                                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            x: tx,
                                            y: ty,
                                            transition: {
                                                type: 'spring',
                                                damping: 14,
                                                stiffness: 220,
                                                delay: i * 0.04
                                            }
                                        }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0,
                                            x: 0,
                                            y: 0,
                                            transition: { duration: 0.2, delay: (actions.length - 1 - i) * 0.04 }
                                        }}
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setActiveAction(action.id as ActionType)}
                                        className={cn(
                                            "absolute w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl pointer-events-auto z-[315]",
                                            action.color, action.glow
                                        )}
                                    >
                                        <action.icon className="w-6 h-6" strokeWidth={2.5} />
                                    </motion.button>
                                )
                            })}
                        </>
                    )}
                </AnimatePresence>

                <motion.button
                    layout
                    onClick={toggleMenu}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                        "w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center transition-all z-[320] relative overflow-hidden pointer-events-auto",
                        isOpen ? "bg-white text-black ring-1 ring-black/5" : "bg-black text-white hover:shadow-black/20"
                    )}
                >
                    {isOpen ? (
                        <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }}>
                            <X className="w-7 h-7" strokeWidth={2.5} />
                        </motion.div>
                    ) : (
                        <motion.div initial={{ rotate: 90 }} animate={{ rotate: 0 }}>
                            <Plus className="w-7 h-7" strokeWidth={2.5} />
                        </motion.div>
                    )}
                    {!isOpen && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-50" />
                    )}
                </motion.button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setIsOpen(false); setActiveAction(null); resetForm(); }}
                        className="fixed inset-0 bg-black/[0.12] backdrop-blur-[6px] z-[290] pointer-events-auto"
                    />
                )}
            </AnimatePresence>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    opacity: 0;
                    position: absolute;
                    right: 0;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }
            `}</style>
        </div>
    )
}
