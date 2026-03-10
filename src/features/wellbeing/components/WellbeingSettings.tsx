'use client'

import React, { useState } from 'react'
import { useWellbeing } from '@/features/wellbeing/contexts/WellbeingContext'
import { Settings, Save, User, Target, Activity, Ruler, Weight, Baby, Info, Layout, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { WellbeingGoal, ActivityLevel, Gender, DashboardComponentId } from '../types'

export function WellbeingSettings() {
    const { profile, updateProfile, dashboardLayout, updateLayout } = useWellbeing()
    const [isSaving, setIsSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        age: profile?.age || 25,
        weight: profile?.weight || 75,
        height: profile?.height || 175,
        gender: profile?.gender || 'male' as Gender,
        activityLevel: profile?.activityLevel || 'moderate' as ActivityLevel,
        goal: profile?.goal || 'maintenance' as WellbeingGoal
    })

    const COMPONENT_LABELS: Record<DashboardComponentId, string> = {
        'macros': 'Macro Summary',
        'weight_trends': 'Weight Progress Chart',
        'active_protocol': 'Main Routine Card',
        'meal_planner': 'Meal Planner',
        'mood_reflection': 'Mood & Reflections',
        'nutritional_trends': '7-Day Calorie Trend',
        'workout_consistency': 'Workout Heatmap',
        'gym_activity': 'Gym Interaction'
    }

    const moveComponent = (column: 'main' | 'sidebar', index: number, direction: 'up' | 'down') => {
        const layout = { ...dashboardLayout }
        const items = [...layout[column]]
        const newIndex = direction === 'up' ? index - 1 : index + 1

        if (newIndex >= 0 && newIndex < items.length) {
            [items[index], items[newIndex]] = [items[newIndex], items[index]]
            updateLayout({ ...layout, [column]: items })
        }
    }

    const toggleComponent = (column: 'main' | 'sidebar', index: number) => {
        const layout = { ...dashboardLayout }
        const items = [...layout[column]]
        items[index] = { ...items[index], isVisible: !items[index].isVisible }
        updateLayout({ ...layout, [column]: items })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setSuccess(false)

        try {
            await updateProfile({
                ...formData,
                updatedAt: new Date().toISOString()
            })
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error('Failed to save settings:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Dashboard Layout Control */}
            <div className="bg-white border border-black/5 rounded-[40px] p-8 md:p-12 shadow-sm space-y-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-rose-500" />
                        <h2 className="text-[11px] font-black text-black/30 uppercase tracking-[0.3em]">Dashboard Interface</h2>
                    </div>
                    <h1 className="text-3xl font-black text-black uppercase tracking-tighter">Layout Management</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Main Column */}
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-widest pl-1">Main Content</h3>
                        <div className="space-y-2">
                            {dashboardLayout.main.map((comp, idx) => (
                                <div key={comp.id} className="flex items-center justify-between p-4 bg-black/[0.02] border border-black/5 rounded-2xl group hover:border-black/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleComponent('main', idx)}
                                            className={cn(
                                                "p-2 rounded-xl transition-colors",
                                                comp.isVisible ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-400"
                                            )}
                                        >
                                            {comp.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <span className={cn(
                                            "text-[12px] font-black uppercase tracking-tight",
                                            !comp.isVisible && "opacity-30"
                                        )}>
                                            {COMPONENT_LABELS[comp.id]}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            disabled={idx === 0}
                                            onClick={() => moveComponent('main', idx, 'up')}
                                            className="p-1.5 hover:bg-black/5 rounded-lg disabled:opacity-30"
                                        >
                                            <ChevronUp className="w-4 h-4 text-black/40" />
                                        </button>
                                        <button
                                            disabled={idx === dashboardLayout.main.length - 1}
                                            onClick={() => moveComponent('main', idx, 'down')}
                                            className="p-1.5 hover:bg-black/5 rounded-lg disabled:opacity-30"
                                        >
                                            <ChevronDown className="w-4 h-4 text-black/40" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-widest pl-1">Sidebar Widgets</h3>
                        <div className="space-y-2">
                            {dashboardLayout.sidebar.map((comp, idx) => (
                                <div key={comp.id} className="flex items-center justify-between p-4 bg-black/[0.02] border border-black/5 rounded-2xl group hover:border-black/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleComponent('sidebar', idx)}
                                            className={cn(
                                                "p-2 rounded-xl transition-colors",
                                                comp.isVisible ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-400"
                                            )}
                                        >
                                            {comp.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <span className={cn(
                                            "text-[12px] font-black uppercase tracking-tight",
                                            !comp.isVisible && "opacity-30"
                                        )}>
                                            {COMPONENT_LABELS[comp.id]}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            disabled={idx === 0}
                                            onClick={() => moveComponent('sidebar', idx, 'up')}
                                            className="p-1.5 hover:bg-black/5 rounded-lg disabled:opacity-30"
                                        >
                                            <ChevronUp className="w-4 h-4 text-black/40" />
                                        </button>
                                        <button
                                            disabled={idx === dashboardLayout.sidebar.length - 1}
                                            onClick={() => moveComponent('sidebar', idx, 'down')}
                                            className="p-1.5 hover:bg-black/5 rounded-lg disabled:opacity-30"
                                        >
                                            <ChevronDown className="w-4 h-4 text-black/40" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-black/5 rounded-[40px] p-8 md:p-12 shadow-sm space-y-10">
                <header className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-rose-500" />
                            <h2 className="text-[11px] font-black text-black/30 uppercase tracking-[0.3em]">Protocol Configuration</h2>
                        </div>
                        <h1 className="text-3xl font-black text-black uppercase tracking-tighter">Profile Settings</h1>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Physical Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-widest pl-1">Biometrics</h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black/40 uppercase tracking-widest pl-1">Age</label>
                                    <div className="relative">
                                        <Baby className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => handleChange('age', parseInt(e.target.value))}
                                            className="w-full bg-black/[0.02] border border-black/5 rounded-2xl py-4 pl-12 pr-4 text-[13px] font-black focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black/40 uppercase tracking-widest pl-1">Height (cm)</label>
                                    <div className="relative">
                                        <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                        <input
                                            type="number"
                                            value={formData.height}
                                            onChange={(e) => handleChange('height', parseInt(e.target.value))}
                                            className="w-full bg-black/[0.02] border border-black/5 rounded-2xl py-4 pl-12 pr-4 text-[13px] font-black focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-black/40 uppercase tracking-widest pl-1">Weight (kg)</label>
                                    <div className="relative">
                                        <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.weight}
                                            onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                                            className="w-full bg-black/[0.02] border border-black/5 rounded-2xl py-4 pl-12 pr-4 text-[13px] font-black focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-widest pl-1">Biological Identity</h3>

                            <div className="grid grid-cols-2 gap-3">
                                {['male', 'female', 'other'].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => handleChange('gender', g)}
                                        className={cn(
                                            "py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all",
                                            formData.gender === g
                                                ? "bg-black text-white border-black shadow-lg"
                                                : "bg-black/[0.02] border-black/5 text-black/40 hover:bg-black/[0.04]"
                                        )}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <hr className="border-black/5" />

                    {/* Goals & Activity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-widest pl-1">Current Goal</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'cut', label: 'Fat Loss (Cut)', icon: Target },
                                    { id: 'maintenance', label: 'Maintain', icon: User },
                                    { id: 'bulk', label: 'Muscle Gain (Bulk)', icon: Activity }
                                ].map((g) => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        onClick={() => handleChange('goal', g.id)}
                                        className={cn(
                                            "flex items-center gap-4 px-6 py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest border transition-all",
                                            formData.goal === g.id
                                                ? "bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-500/20"
                                                : "bg-black/[0.02] border-black/5 text-black/40 hover:bg-black/[0.04]"
                                        )}
                                    >
                                        <g.icon className={cn("w-5 h-5", formData.goal === g.id ? "text-white" : "text-black/20")} />
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black text-rose-500 uppercase tracking-widest pl-1">Activity Coefficient</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
                                    { id: 'light', label: 'Light', desc: 'Active 1-3 days/week' },
                                    { id: 'moderate', label: 'Moderate', desc: 'Active 3-5 days/week' },
                                    { id: 'active', label: 'Very Active', desc: 'Daily intense training' }
                                ].map((a) => (
                                    <button
                                        key={a.id}
                                        type="button"
                                        onClick={() => handleChange('activityLevel', a.id)}
                                        className={cn(
                                            "flex flex-col items-start px-6 py-4 rounded-2xl border transition-all text-left",
                                            formData.activityLevel === a.id
                                                ? "bg-black text-white border-black shadow-xl"
                                                : "bg-black/[0.02] border-black/5 text-black/40 hover:bg-black/[0.04]"
                                        )}
                                    >
                                        <span className="text-[12px] font-black uppercase tracking-widest">{a.label}</span>
                                        <span className={cn("text-[9px] font-bold uppercase", formData.activityLevel === a.id ? "text-white/40" : "text-black/20")}>{a.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-black/30">
                            <Info className="w-4 h-4" />
                            <p className="text-[10px] font-bold uppercase">Changes will automatically update your macro targets.</p>
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={cn(
                                "flex items-center gap-3 px-10 py-5 rounded-[24px] text-[13px] font-black uppercase tracking-[0.2em] transition-all",
                                success && !isSaving
                                    ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/10"
                                    : "bg-black text-white hover:scale-105 active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50"
                            )}
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : success ? (
                                'Sync Successful'
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Synchronize Stats
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Danger Zone / Factory Reset */}
            <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-8 flex items-center justify-between group">
                <div className="space-y-1">
                    <h3 className="text-[11px] font-black text-rose-600 uppercase tracking-widest">Protocol Reset</h3>
                    <p className="text-[12px] font-medium text-rose-500/60 uppercase">Erase all local and cloud data associated with this module.</p>
                </div>
                <button className="px-6 py-3 bg-white border border-rose-200 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
                    Reset Module
                </button>
            </div>
        </div>
    )
}
