'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Receipt, CheckSquare, Clipboard, Loader2, Sparkles, ListChecks, Calendar, Tag, Layers, Info } from 'lucide-react'
import { usePockets } from '@/features/finance/hooks/usePockets'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'
import { usePathname } from 'next/navigation'
import { FINANCE_CATEGORIES } from '@/features/finance/constants/categories'

type ActionType = 'spend' | 'task' | 'vault' | null

const STRATEGIC_CATEGORIES = [
    { id: 'finance', label: 'Finance', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'career', label: 'Career', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { id: 'health', label: 'Health', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    { id: 'personal', label: 'Personal', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
] as const

const PRIORITY_OPTS = [
    { id: 'super', label: 'Super', color: 'bg-blue-500' },
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

    // Essential hooks called UNCONDITIONALLY
    const { pockets, updatePocket } = usePockets()
    const { activeProfile } = useFinanceProfile()

    // Form States
    const [form, setForm] = useState({
        amount: '',
        pocketId: '',
        description: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        taskTitle: '',
        taskCategory: 'todo' as 'todo' | 'grocery' | 'reminder',
        taskPriority: 'mid' as 'super' | 'high' | 'mid' | 'low',
        strategicCategory: 'personal' as 'finance' | 'career' | 'health' | 'personal',
        dueDate: '',
        vaultText: ''
    })

    useEffect(() => {
        setMounted(true)
    }, [])

    const resetForm = () => {
        setForm({
            amount: '',
            pocketId: '',
            description: '',
            category: 'other',
            date: new Date().toISOString().split('T')[0],
            taskTitle: '',
            taskCategory: 'todo',
            taskPriority: 'mid',
            strategicCategory: 'personal',
            dueDate: '',
            vaultText: ''
        })
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
            if (activeAction === 'spend') {
                const amt = parseFloat(form.amount)
                const pocket = pockets.find(p => p.id === form.pocketId)
                if (!amt || !pocket) throw new Error('Invalid amount or pocket')

                await supabase.from('fin_transactions').insert({
                    type: 'spend',
                    amount: amt,
                    pocket_id: form.pocketId,
                    description: form.description || 'Quick Spend',
                    date: form.date,
                    category: form.category,
                    emoji: FINANCE_CATEGORIES.find(c => c.id === form.category)?.emoji || '💸',
                    profile: activeProfile
                })
                await updatePocket(form.pocketId, { balance: (pocket.balance || 0) - amt })
            } else if (activeAction === 'task') {
                if (!form.taskTitle.trim()) throw new Error('Task title required')
                const { error } = await supabase.from('fin_tasks').insert({
                    title: form.taskTitle,
                    category: form.taskCategory,
                    priority: form.taskPriority,
                    strategic_category: form.strategicCategory,
                    due_date: form.dueDate || null,
                    profile: activeProfile === 'business' ? 'business' : 'personal'
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
        { id: 'spend', label: 'Spend', icon: Receipt, color: 'bg-rose-500', glow: 'shadow-rose-500/40' },
        { id: 'task', label: 'Task', icon: CheckSquare, color: 'bg-indigo-500', glow: 'shadow-indigo-500/40' },
        { id: 'vault', label: 'Vault', icon: Clipboard, color: 'bg-amber-500', glow: 'shadow-amber-500/40' },
    ], [])

    // Early return for SSR and excluded routes AFTER all hook calls
    if (!mounted || pathname === '/intelligence') return null

    // Radial Positioning constants
    const radius = 100 // Spaced out for clarity
    const startAngle = 185
    const endAngle = 265
    const angleStep = (endAngle - startAngle) / (actions.length - 1)

    // Shared UI classes for absolute symmetry
    const inputHeight = "h-[48px]"
    const inputBase = cn(inputHeight, "w-full bg-black/[0.03] border border-black/5 rounded-2xl px-4 text-[13px] font-bold outline-none transition-all flex items-center box-border")

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
                                {activeAction === 'spend' && (
                                    <>
                                        {/* Metadata Header - Pocket and Category moved ABOVE text */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Allocation</label>
                                                <div className="relative">
                                                    <select
                                                        value={form.pocketId}
                                                        onChange={e => setForm({ ...form, pocketId: e.target.value })}
                                                        className={cn(inputBase, "appearance-none cursor-pointer focus:ring-4 focus:ring-rose-500/10")}
                                                    >
                                                        <option value="">Pocket...</option>
                                                        {pockets.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                    <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Category</label>
                                                <div className="relative">
                                                    <select
                                                        value={form.category}
                                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                                        className={cn(inputBase, "appearance-none cursor-pointer focus:ring-4 focus:ring-rose-500/10")}
                                                    >
                                                        {FINANCE_CATEGORIES.map(c => (
                                                            <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                                                        ))}
                                                    </select>
                                                    <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Primary Input - Amount prioritized below metadata hierarchy */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1 tracking-widest">Financial Value</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 font-black text-lg group-focus-within:text-rose-500 transition-colors">£</span>
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    value={form.amount}
                                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                                    placeholder="0.00"
                                                    className={cn(inputBase, "pl-8 text-2xl font-black h-[64px] focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/20")}
                                                />
                                            </div>
                                        </div>

                                        {/* Bottom Contextual Layer */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Context</label>
                                                <input
                                                    value={form.description}
                                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                                    placeholder="Details..."
                                                    className={cn(inputBase, "focus:ring-4 focus:ring-rose-500/10")}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Date</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={form.date}
                                                        onChange={e => setForm({ ...form, date: e.target.value })}
                                                        className={cn(inputBase, "focus:ring-4 focus:ring-rose-500/10 py-0")}
                                                    />
                                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeAction === 'task' && (
                                    <>
                                        {/* Metadata Header - Priority and Category (Type) sit ABOVE text */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Operation Type</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['todo', 'grocery', 'reminder'] as const).map(cat => (
                                                        <button
                                                            key={cat}
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
                                                    <div className={cn(inputBase, "px-2 bg-black/[0.01] border-black/10 overflow-x-auto no-scrollbar")}>
                                                        <div className="flex gap-1 items-center">
                                                            {PRIORITY_OPTS.map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => setForm({ ...form, taskPriority: p.id as any })}
                                                                    className={cn(
                                                                        "px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all border shrink-0",
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
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Deadline</label>
                                                    <div className="relative">
                                                        <input
                                                            type="date"
                                                            value={form.dueDate}
                                                            onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                                            className={cn(inputBase, "focus:ring-4 focus:ring-indigo-500/10 py-0")}
                                                        />
                                                        <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Primary Input - Deployment Title below metadata hierarchy */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Deployment Title</label>
                                            <input
                                                autoFocus
                                                value={form.taskTitle}
                                                onChange={e => setForm({ ...form, taskTitle: e.target.value })}
                                                placeholder="Action item details..."
                                                className={cn(inputBase, "text-[16px] font-black bg-black/[0.03] placeholder:text-black/10 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/20 py-6 h-[56px]")}
                                            />
                                        </div>

                                        {/* Bottom Strategic Layer */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Strategic Alignment</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {STRATEGIC_CATEGORIES.map(strat => (
                                                    <button
                                                        key={strat.id}
                                                        onClick={() => setForm({ ...form, strategicCategory: strat.id as any })}
                                                        className={cn(
                                                            "px-3 py-2.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2",
                                                            form.strategicCategory === strat.id
                                                                ? strat.color
                                                                : "bg-black/[0.02] border-black/5 text-black/40 hover:bg-black/[0.04]"
                                                        )}
                                                    >
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", form.strategicCategory === strat.id ? strat.color.split(' ')[0].replace('text', 'bg') : "bg-black/10")} />
                                                        {strat.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
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

            {/* Anchor Div for Center-Alignment of Dial nodes */}
            <div className="relative w-16 h-16 flex items-center justify-center pointer-events-none">

                {/* Radial Speed Dial */}
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

                {/* Main FAB Trigger */}
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

            {/* Subtle Backdrop - Placed BELOW the dial elements in Z-space */}
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
                /* Standardize date picker inner heights for Safari/Chrome */
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
