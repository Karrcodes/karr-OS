'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Receipt, CheckSquare, Clipboard, Loader2, CreditCard, ListChecks, Type, Sparkles } from 'lucide-react'
import { usePockets } from '@/features/finance/hooks/usePockets'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'
import { usePathname } from 'next/navigation'

type ActionType = 'spend' | 'task' | 'vault' | null

export function GlobalQuickAction() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [activeAction, setActiveAction] = useState<ActionType>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Hide in Intelligence module
    if (pathname === '/intelligence') return null

    // Data for Actions
    const { pockets, updatePocket } = usePockets()
    const { activeProfile } = useFinanceProfile()

    // Form States
    const [form, setForm] = useState({
        amount: '',
        pocketId: '',
        description: '',
        taskTitle: '',
        taskCategory: 'todo' as 'todo' | 'grocery' | 'reminder',
        taskPriority: 'mid' as 'super' | 'high' | 'mid' | 'low',
        vaultText: ''
    })

    const resetForm = () => {
        setForm({
            amount: '',
            pocketId: '',
            description: '',
            taskTitle: '',
            taskCategory: 'todo',
            taskPriority: 'mid',
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
                    date: new Date().toISOString().split('T')[0],
                    category: 'other',
                    emoji: '💸',
                    profile: activeProfile
                })
                await updatePocket(form.pocketId, { balance: (pocket.balance || 0) - amt })
            } else if (activeAction === 'task') {
                if (!form.taskTitle.trim()) throw new Error('Task title required')
                const { error } = await supabase.from('fin_tasks').insert({
                    title: form.taskTitle,
                    category: form.taskCategory,
                    priority: form.taskPriority,
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

    const actions = [
        { id: 'spend', label: 'Log Spend', icon: Receipt, color: 'bg-gradient-to-br from-rose-500 to-rose-600', textColor: 'text-rose-500' },
        { id: 'task', label: 'New Task', icon: CheckSquare, color: 'bg-gradient-to-br from-indigo-500 to-indigo-600', textColor: 'text-indigo-500' },
        { id: 'vault', label: 'Vault Item', icon: Clipboard, color: 'bg-gradient-to-br from-amber-500 to-amber-600', textColor: 'text-amber-500' },
    ]

    return (
        <div className="fixed bottom-6 right-6 md:right-8 z-[200] flex flex-col items-end gap-3 safe-bottom">
            {/* Speed Dial Menu */}
            <AnimatePresence>
                {isOpen && !activeAction && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={{
                            visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
                            hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
                        }}
                        className="flex flex-col items-end gap-2 mb-2"
                    >
                        {actions.map((action) => (
                            <motion.button
                                key={action.id}
                                variants={{
                                    hidden: { opacity: 0, scale: 0.3, y: 20 },
                                    visible: { opacity: 1, scale: 1, y: 0 }
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveAction(action.id as ActionType)}
                                className="flex items-center gap-3 group"
                            >
                                <motion.span
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-black/90 text-white backdrop-blur shadow-xl border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    {action.label}
                                </motion.span>
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white ring-4 ring-black/5",
                                    action.color
                                )}>
                                    <action.icon className="w-6 h-6" strokeWidth={2.5} />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB */}
            <motion.button
                layout
                onClick={toggleMenu}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                    "w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center transition-all z-[210] relative overflow-hidden",
                    isOpen ? "bg-white text-black ring-1 ring-black/5" : "bg-black text-white hover:shadow-black/20"
                )}
            >
                {isOpen ? (
                    <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }} transition={{ type: 'spring', damping: 10 }}>
                        <X className="w-7 h-7" strokeWidth={2.5} />
                    </motion.div>
                ) : (
                    <motion.div initial={{ rotate: 90 }} animate={{ rotate: 0 }} transition={{ type: 'spring', damping: 10 }}>
                        <Plus className="w-7 h-7" strokeWidth={2.5} />
                    </motion.div>
                )}
                {!isOpen && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-50" />
                )}
            </motion.button>

            {/* Action Panel */}
            <AnimatePresence>
                {activeAction && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed inset-x-4 bottom-24 md:absolute md:bottom-20 md:right-0 md:w-[320px] bg-white/80 backdrop-blur-3xl rounded-[32px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.3)] border border-black/5 overflow-hidden flex flex-col z-[220]"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between bg-white/40">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg", actions.find(a => a.id === activeAction)?.color)}>
                                    {actions.find(a => a.id === activeAction)?.icon && React.createElement(actions.find(a => a.id === activeAction)!.icon, { className: "w-4 h-4" })}
                                </div>
                                <h3 className="text-[15px] font-black text-black uppercase tracking-tighter">
                                    {actions.find(a => a.id === activeAction)?.label}
                                </h3>
                            </div>
                            <button onClick={() => setActiveAction(null)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/40 hover:text-black transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto no-scrollbar">
                            {activeAction === 'spend' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Value</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 font-black text-lg group-focus-within:text-rose-500 transition-colors">£</span>
                                            <input
                                                autoFocus
                                                type="number"
                                                value={form.amount}
                                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full bg-black/[0.03] border border-black/5 rounded-2xl pl-8 pr-4 py-4 text-2xl font-black outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Allocation</label>
                                        <select
                                            value={form.pocketId}
                                            onChange={e => setForm({ ...form, pocketId: e.target.value })}
                                            className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-4 py-4 text-[14px] font-bold outline-none appearance-none focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer"
                                        >
                                            <option value="">Select Target...</option>
                                            {pockets.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} — £{p.balance?.toFixed(2)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {activeAction === 'task' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Operation Title</label>
                                        <input
                                            autoFocus
                                            value={form.taskTitle}
                                            onChange={e => setForm({ ...form, taskTitle: e.target.value })}
                                            placeholder="Deployment details..."
                                            className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-4 py-4 text-[14px] font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/20 transition-all placeholder:text-black/20"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['todo', 'grocery', 'reminder'] as const).map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setForm({ ...form, taskCategory: cat })}
                                                className={cn(
                                                    "py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border",
                                                    form.taskCategory === cat
                                                        ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                                                        : "bg-black/[0.02] text-black/40 border-black/5 hover:bg-black/[0.05]"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {activeAction === 'vault' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Asset Transfer</label>
                                    <textarea
                                        autoFocus
                                        value={form.vaultText}
                                        onChange={e => setForm({ ...form, vaultText: e.target.value })}
                                        placeholder="Secure message or link..."
                                        className="w-full h-32 bg-black/[0.03] border border-black/5 rounded-2xl px-4 py-4 text-[14px] font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/20 transition-all resize-none no-scrollbar"
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
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
                                            <><Sparkles className="w-4 h-4" /> Save Record</>}
                                </span>
                                {!success && !loading && (
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setIsOpen(false); setActiveAction(null); resetForm(); }}
                        className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[190]"
                    />
                )}
            </AnimatePresence>

            <style jsx global>{`
                .safe-bottom {
                    bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}
