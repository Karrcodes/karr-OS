'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Save, Trash2, Settings2, Check, CreditCard, ShoppingCart, Bell, Target, TrendingUp, Heart, Briefcase, User, Beaker, Factory, Tv, Wallet, Car } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { TaskTemplate } from '../types/tasks.types'
import { useTasksProfile } from '../contexts/TasksProfileContext'

interface TaskSettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

const STRATEGIC_CATEGORIES = {
    personal: [
        { id: 'finance', label: 'Finance', icon: Wallet, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
        { id: 'career', label: 'Career', icon: Briefcase, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
        { id: 'health', label: 'Health', icon: Heart, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
        { id: 'personal', label: 'Personal', icon: User, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    ],
    business: [
        { id: 'rnd', label: 'R&D', icon: Beaker, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
        { id: 'production', label: 'Production', icon: Factory, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
        { id: 'media', label: 'Media', icon: Tv, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
        { id: 'growth', label: 'Growth', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    ]
}

export function TaskSettingsModal({ isOpen, onClose }: TaskSettingsModalProps) {
    const { activeProfile } = useTasksProfile()
    const [templates, setTemplates] = useState<TaskTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<Partial<TaskTemplate> | null>(null)
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

    const DEFAULT_TEMPLATE: Partial<TaskTemplate> = {
        title: '',
        category: 'todo',
        priority: 'low',
        estimated_duration: 30,
        travel_to_duration: 15,
        travel_from_duration: 15,
        impact_score: 5
    }

    useEffect(() => {
        if (isOpen) {
            fetchTemplates()
        }
    }, [isOpen])

    const fetchTemplates = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('fin_task_templates')
            .select('*')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setTemplates(data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!editingTemplate?.title) return

        const payload = {
            ...editingTemplate,
            profile: activeProfile,
            updated_at: new Date().toISOString()
        }

        let error
        if (editingTemplate.id) {
            const { error: err } = await supabase
                .from('fin_task_templates')
                .update(payload)
                .eq('id', editingTemplate.id)
            error = err
        } else {
            const { error: err } = await supabase
                .from('fin_task_templates')
                .insert([{ ...payload, created_at: new Date().toISOString() }])
            error = err
        }

        if (!error) {
            setIsAdding(false)
            setEditingTemplate(null)
            fetchTemplates()
        }
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('fin_task_templates')
            .delete()
            .eq('id', id)

        if (!error) {
            fetchTemplates()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-black/[0.05] flex items-center justify-between bg-black/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white">
                            <Settings2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-black tracking-tight">Operation Presets</h2>
                            <p className="text-[12px] text-black/40 font-bold uppercase tracking-widest">Manage Task Templates</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-black/[0.03] hover:bg-black/[0.08] flex items-center justify-center text-black/40 hover:text-black transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Add New Template Button */}
                    {!isAdding && (
                        <button
                            onClick={() => {
                                setIsAdding(true)
                                setEditingTemplate({
                                    ...DEFAULT_TEMPLATE,
                                    strategic_category: activeProfile === 'business' ? 'rnd' : 'personal' as any,
                                    priority: 'mid'
                                })
                            }}
                            className="w-full py-4 border-2 border-dashed border-black/10 rounded-2xl flex items-center justify-center gap-2 text-black/40 hover:text-black hover:border-black/20 hover:bg-black/[0.01] transition-all group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-[14px]">Create New Preset</span>
                        </button>
                    )}

                    {/* Template Form */}
                    <AnimatePresence>
                        {isAdding && editingTemplate && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-black/[0.02] border border-black/[0.08] rounded-2xl overflow-hidden"
                            >
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[14px] font-black uppercase tracking-widest text-black/60">
                                            {editingTemplate.id ? 'Edit Preset' : 'Create New Preset'}
                                        </h3>
                                        {editingTemplate.id && (
                                            <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">Editing Mode</span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Title</label>
                                            <input
                                                value={editingTemplate.title}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                                                placeholder="e.g. Weekly Review"
                                                className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 font-bold text-[14px] outline-none focus:border-black/30 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Type</label>
                                            <div className="flex bg-white rounded-xl border border-black/10 p-1">
                                                {(['todo', 'grocery', 'reminder'] as const).map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setEditingTemplate({ ...editingTemplate, category: c })}
                                                        className={cn(
                                                            "flex-1 py-2 rounded-lg text-[11px] font-bold uppercase transition-all",
                                                            editingTemplate.category === c ? "bg-black text-white" : "text-black/30 hover:bg-black/5"
                                                        )}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Criticality</label>
                                            <div className="flex bg-white rounded-xl border border-black/10 p-1">
                                                {(['low', 'mid', 'high', 'urgent'] as const).map(p => (
                                                    <button
                                                        key={p}
                                                        onClick={() => setEditingTemplate({ ...editingTemplate, priority: p })}
                                                        className={cn(
                                                            "flex-1 py-2 rounded-lg text-[11px] font-bold uppercase transition-all",
                                                            editingTemplate.priority === p ? "bg-black text-white" : "text-black/30 hover:bg-black/5"
                                                        )}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Strategic Alignment</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {((activeProfile === 'business' ? STRATEGIC_CATEGORIES.business : STRATEGIC_CATEGORIES.personal) as any[]).map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => setEditingTemplate({ ...editingTemplate, strategic_category: s.id })}
                                                    className={cn(
                                                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all",
                                                        editingTemplate.strategic_category === s.id ? s.color : "bg-white border-black/10 text-black/40 hover:bg-black/5"
                                                    )}
                                                >
                                                    <s.icon className="w-3.5 h-3.5" />
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Duration (m)</label>
                                            <select
                                                value={editingTemplate.estimated_duration}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, estimated_duration: parseInt(e.target.value) })}
                                                className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 font-bold text-[14px] outline-none focus:border-black/30 appearance-none cursor-pointer"
                                            >
                                                {Array.from({ length: 16 }, (_, i) => (i + 1) * 15).map(mins => (
                                                    <option key={mins} value={mins}>
                                                        {mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}` : `${mins}m`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-1 flex items-center gap-1">
                                                <Car className="w-3 h-3" /> Travel (mins)
                                            </label>
                                            <select
                                                value={editingTemplate.travel_to_duration || 0}
                                                onChange={(e) => setEditingTemplate({
                                                    ...editingTemplate,
                                                    travel_to_duration: parseInt(e.target.value),
                                                    travel_from_duration: parseInt(e.target.value)
                                                })}
                                                className="w-full bg-white border border-black/[0.1] rounded-xl px-3 py-2 text-[13px] text-black outline-none focus:border-black/40 transition-colors appearance-none cursor-pointer"
                                            >
                                                <option value="0">None</option>
                                                {[15, 30, 45, 60, 90, 120].map(mins => (
                                                    <option key={mins} value={mins}>{mins}m</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Impact (1-10)</label>
                                            <input
                                                type="number" min="1" max="10"
                                                value={editingTemplate.impact_score}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, impact_score: parseInt(e.target.value) })}
                                                className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 font-bold text-[14px] outline-none focus:border-black/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => setIsAdding(false)}
                                            className="flex-1 py-3 rounded-xl bg-black/5 hover:bg-black/10 text-black/60 font-bold text-[14px] transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="flex-1 py-3 rounded-xl bg-black text-white font-bold text-[14px] hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Preset
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Template List */}
                    <div className="space-y-3">
                        <label className="text-[12px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Existing Presets</label>
                        {loading ? (
                            <div className="py-12 flex flex-col items-center gap-3 text-black/20">
                                <div className="w-8 h-8 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Loading presets...</span>
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="py-12 text-center text-black/30 bg-black/[0.01] rounded-2xl border border-dashed border-black/10">
                                <p className="text-[13px] font-medium">No presets configured yet</p>
                            </div>
                        ) : (
                            templates.map(tmpl => (
                                <div
                                    key={tmpl.id}
                                    className="group bg-white border border-black/[0.08] hover:border-black/20 rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-lg hover:shadow-black/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center border",
                                            tmpl.category === 'todo' ? "bg-indigo-50 border-indigo-100 text-indigo-500" :
                                                tmpl.category === 'grocery' ? "bg-emerald-50 border-emerald-100 text-emerald-500" :
                                                    "bg-amber-50 border-amber-100 text-amber-500"
                                        )}>
                                            {tmpl.category === 'todo' ? <Check className="w-6 h-6" /> :
                                                tmpl.category === 'grocery' ? <ShoppingCart className="w-6 h-6" /> :
                                                    <Bell className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[15px] text-black leading-tight">{tmpl.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-black/5 text-black/40">{tmpl.priority}</span>
                                                <span className="text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-black/5 text-black/40">{tmpl.estimated_duration}m</span>
                                                {(tmpl.travel_to_duration || tmpl.travel_from_duration) && (
                                                    <span className="text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 flex items-center gap-1">
                                                        <Car className="w-2.5 h-2.5" />
                                                        {tmpl.travel_to_duration || 0}{tmpl.travel_from_duration !== tmpl.travel_to_duration ? `+${tmpl.travel_from_duration || 0}` : ''}m
                                                    </span>
                                                )}
                                                {tmpl.strategic_category && (
                                                    <span className="text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-black/5 text-black/40">{tmpl.strategic_category}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 transition-opacity">
                                        {confirmingDelete === tmpl.id ? (
                                            <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
                                                <button
                                                    onClick={() => setConfirmingDelete(null)}
                                                    className="px-3 py-1.5 rounded-lg bg-black/[0.03] text-[10px] font-bold text-black/40 hover:bg-black/[0.08]"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDelete(tmpl.id)
                                                        setConfirmingDelete(null)
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 shadow-lg shadow-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setIsAdding(true)
                                                        setEditingTemplate(tmpl)
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-black/[0.03] sm:bg-transparent hover:bg-black/[0.08] flex items-center justify-center text-black/40 hover:text-black transition-all"
                                                >
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmingDelete(tmpl.id)}
                                                    className="w-10 h-10 rounded-xl bg-black/[0.03] sm:bg-transparent hover:bg-red-50 flex items-center justify-center text-black/20 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/5 text-center">
                    <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.3em]">Advanced Operations Control</p>
                </div>
            </motion.div>
        </div>
    )
}
