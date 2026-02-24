'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Receipt, CheckSquare, Clipboard, Loader2, CreditCard, ListChecks, Type } from 'lucide-react'
import { usePockets } from '@/features/finance/hooks/usePockets'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'

type ActionType = 'spend' | 'task' | 'vault' | null

export function GlobalQuickAction() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeAction, setActiveAction] = useState<ActionType>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Data for Actions
    const { pockets, updatePocket } = usePockets()
    const { createTask } = useTasks('todo')
    const { activeProfile } = useFinanceProfile()

    // Form States
    const [form, setForm] = useState({
        // Spend
        amount: '',
        pocketId: '',
        description: '',
        // Task
        taskTitle: '',
        taskCategory: 'todo' as 'todo' | 'grocery' | 'reminder',
        taskPriority: 'mid' as 'super' | 'high' | 'mid' | 'low',
        // Vault
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
                // Note: useTasks hook's createTask uses the category passed to useTasks. 
                // However, we might want to override or use different instances.
                // For simplicity in FAB, we'll just insert to Supabase directly if we want dynamic categories 
                // OR use separate hook calls. Let's use direct insert for flexibility here.
                const { error } = await supabase.from('fin_tasks').insert({
                    title: form.taskTitle,
                    category: form.taskCategory,
                    priority: form.taskPriority,
                    profile: activeProfile === 'business' ? 'business' : 'personal' // Map finance profile to task profile loosely
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
            }, 1000)
        } catch (err) {
            console.error(err)
            alert('Failed to save action')
        } finally {
            setLoading(false)
        }
    }

    const actions = [
        { id: 'spend', label: 'Log Spend', icon: Receipt, color: 'bg-rose-500', textColor: 'text-rose-500' },
        { id: 'task', label: 'New Task', icon: CheckSquare, color: 'bg-indigo-500', textColor: 'text-indigo-500' },
        { id: 'vault', label: 'Vault Item', icon: Clipboard, color: 'bg-amber-500', textColor: 'text-amber-500' },
    ]

    return (
        <div className="fixed bottom-6 right-6 md:right-8 z-[100] flex flex-col items-end gap-3">
            {/* Speed Dial Menu */}
            <AnimatePresence>
                {isOpen && !activeAction && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        className="flex flex-col items-end gap-2 mb-2"
                    >
                        {actions.map((action, i) => (
                            <motion.button
                                key={action.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                                onClick={() => setActiveAction(action.id as ActionType)}
                                className="flex items-center gap-3 group"
                            >
                                <span className="bg-white/90 backdrop-blur shadow-sm border border-black/5 px-2 py-1 rounded-lg text-[11px] font-bold text-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {action.label}
                                </span>
                                <div className={cn("w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95", action.color)}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB */}
            <button
                onClick={toggleMenu}
                className={cn(
                    "w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-90 z-50",
                    isOpen ? "bg-white border border-black/5 text-black" : "bg-black text-white hover:bg-neutral-800"
                )}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </button>

            {/* Action Modals / Forms */}
            <AnimatePresence>
                {activeAction && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-x-4 bottom-24 md:absolute md:bottom-20 md:right-0 md:w-80 bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
                            <h3 className="text-[14px] font-bold text-black">
                                {actions.find(a => a.id === activeAction)?.label}
                            </h3>
                            <button onClick={() => setActiveAction(null)} className="text-black/20 hover:text-black">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {activeAction === 'spend' && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Amount (£)</label>
                                        <input
                                            autoFocus
                                            type="number"
                                            value={form.amount}
                                            onChange={e => setForm({ ...form, amount: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full bg-black/5 border-none rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-rose-500/20"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Source</label>
                                        <select
                                            value={form.pocketId}
                                            onChange={e => setForm({ ...form, pocketId: e.target.value })}
                                            className="w-full bg-black/5 border-none rounded-xl px-4 py-3 text-[14px] outline-none"
                                        >
                                            <option value="">Select Pocket...</option>
                                            {pockets.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {activeAction === 'task' && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Task Title</label>
                                        <input
                                            autoFocus
                                            value={form.taskTitle}
                                            onChange={e => setForm({ ...form, taskTitle: e.target.value })}
                                            placeholder="What needs doing?"
                                            className="w-full bg-black/5 border-none rounded-xl px-4 py-3 text-[14px] font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {(['todo', 'grocery', 'reminder'] as const).map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setForm({ ...form, taskCategory: cat })}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all",
                                                    form.taskCategory === cat ? "bg-indigo-500 text-white" : "bg-black/5 text-black/40"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            {activeAction === 'vault' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Vault Content</label>
                                    <textarea
                                        autoFocus
                                        value={form.vaultText}
                                        onChange={e => setForm({ ...form, vaultText: e.target.value })}
                                        placeholder="Paste a link or note..."
                                        className="w-full h-24 bg-black/5 border-none rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={loading || success}
                                className={cn(
                                    "w-full py-4 rounded-2xl text-white font-bold text-[14px] transition-all flex items-center justify-center gap-2",
                                    success ? "bg-emerald-500" :
                                        actions.find(a => a.id === activeAction)?.color,
                                    (loading || success) && "opacity-80"
                                )}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                    success ? 'Action Completed' : 'Save Item'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop for open speed dial */}
            {isOpen && (
                <div
                    onClick={() => { setIsOpen(false); setActiveAction(null); resetForm(); }}
                    className="fixed inset-0 bg-white/40 backdrop-blur-sm z-[40]"
                />
            )}
        </div>
    )
}
