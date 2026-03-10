'use client'

import React, { useState } from 'react'
import { useWellbeing } from '../contexts/WellbeingContext'
import type { WellbeingProfile, ActivityLevel, WellbeingGoal, Gender } from '../types'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, User, Activity, Target, CheckCircle2, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
    { id: 'basics', label: 'Basics', icon: User },
    { id: 'metrics', label: 'Metrics', icon: Heart },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'goal', label: 'Goal', icon: Target },
]

export function ProfileSetup() {
    const { updateProfile } = useWellbeing()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState(0)
    const [form, setForm] = useState<Partial<WellbeingProfile>>({
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'maintenance'
    })

    const handleNext = async () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1)
        } else {
            setIsSubmitting(true)
            try {
                const finalProfile: WellbeingProfile = {
                    ...(form as any),
                    updatedAt: new Date().toISOString()
                }
                await updateProfile(finalProfile)
            } catch (e) {
                console.error('Failed to update profile:', e)
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    const handleBack = () => {
        if (step > 0) setStep(step - 1)
    }

    const isStepValid = () => {
        if (step === 0) return !!form.age && !!form.gender
        if (step === 1) return !!form.weight && !!form.height
        return true
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-[500px] space-y-12">
                {/* Progress Header */}
                <div className="flex items-center justify-between px-2">
                    {STEPS.map((s, i) => (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all border-2",
                                i === step ? "bg-black text-white border-black" :
                                    i < step ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-black/20 border-black/5"
                            )}>
                                {i < step ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                i === step ? "text-black" : "text-black/20"
                            )}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Form Content */}
                <div className="min-h-[300px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {step === 0 && (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Your Profile</h1>
                                        <p className="text-black/40 text-[14px] font-medium leading-relaxed">We need some basic info to calculate your metabolism correctly.</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Age</label>
                                            <input
                                                autoFocus
                                                type="number"
                                                value={form.age || ''}
                                                onChange={e => setForm({ ...form, age: parseInt(e.target.value) })}
                                                placeholder="e.g. 24"
                                                className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-6 py-4 text-xl font-black outline-none focus:ring-4 focus:ring-black/5 focus:border-black/10 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Gender</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {(['male', 'female'] as Gender[]).map(g => (
                                                    <button key={g} onClick={() => setForm({ ...form, gender: g })}
                                                        className={cn('py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all border-2', form.gender === g ? 'bg-black text-white border-black shadow-xl shadow-black/10 scale-[1.02]' : 'bg-black/[0.02] text-black/40 border-black/5 hover:bg-black/[0.04]')}
                                                    >{g}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Vital Metrics</h1>
                                        <p className="text-black/40 text-[14px] font-medium leading-relaxed">Your weight and height are used to determine your basal metabolic rate (BMR).</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Weight (kg)</label>
                                            <input
                                                autoFocus
                                                type="number"
                                                value={form.weight || ''}
                                                onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) })}
                                                placeholder="75.0"
                                                className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-6 py-4 text-xl font-black outline-none focus:ring-4 focus:ring-black/5 focus:border-black/10 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Height (cm)</label>
                                            <input
                                                type="number"
                                                value={form.height || ''}
                                                onChange={e => setForm({ ...form, height: parseFloat(e.target.value) })}
                                                placeholder="180"
                                                className="w-full bg-black/[0.03] border border-black/5 rounded-2xl px-6 py-4 text-xl font-black outline-none focus:ring-4 focus:ring-black/5 focus:border-black/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Activity Level</h1>
                                        <p className="text-black/40 text-[14px] font-medium leading-relaxed">How often do you move? This helps calculate your total daily expenditure (TDEE).</p>
                                    </div>
                                    <div className="space-y-3">
                                        {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as ActivityLevel[]).map(level => (
                                            <button key={level} onClick={() => setForm({ ...form, activityLevel: level })}
                                                className={cn('w-full px-6 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all border-2 text-left flex items-center justify-between', form.activityLevel === level ? 'bg-black text-white border-black shadow-xl shadow-black/10 scale-[1.01]' : 'bg-black/[0.02] text-black/40 border-black/5 hover:bg-black/[0.04]')}
                                            >
                                                {level.replace('_', ' ')}
                                                {form.activityLevel === level && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <h1 className="text-4xl font-black text-rose-500 uppercase tracking-tighter">Choose Goal</h1>
                                        <p className="text-black/40 text-[14px] font-medium leading-relaxed">Select your current protocol focus to adjust your macro targets.</p>
                                    </div>
                                    <div className="space-y-3">
                                        {(['cut', 'maintenance', 'bulk'] as WellbeingGoal[]).map(goal => (
                                            <button key={goal} onClick={() => setForm({ ...form, goal: goal })}
                                                className={cn('w-full px-6 py-8 rounded-[32px] transition-all border-2 text-left flex items-center gap-6 overflow-hidden relative',
                                                    form.goal === goal ? 'bg-black text-white border-black shadow-2xl scale-[1.02]' : 'bg-black/[0.02] text-black/40 border-black/5 hover:bg-black/[0.04]'
                                                )}
                                            >
                                                <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0",
                                                    goal === 'cut' ? "bg-emerald-500/10 text-emerald-500" :
                                                        goal === 'maintenance' ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                                                )}>
                                                    <Target className="w-8 h-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black uppercase tracking-tighter">{goal}</h3>
                                                    <p className={cn("text-[11px] font-bold uppercase tracking-widest leading-relaxed", form.goal === goal ? "text-white/40" : "text-black/20")}>
                                                        {goal === 'cut' ? 'Lose body fat while maintaining muscle mass.' :
                                                            goal === 'maintenance' ? 'Stay at your current weight and improve health.' : 'Gain muscle mass and strength.'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center gap-4">
                    {step > 0 && (
                        <button onClick={handleBack} className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center text-black/40 hover:text-black hover:bg-black/10 transition-all">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={!isStepValid() || isSubmitting}
                        className={cn(
                            "flex-1 py-5 rounded-2xl text-[14px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                            isStepValid() ? "bg-black text-white shadow-2xl shadow-black/20" : "bg-black/5 text-black/20 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {step === STEPS.length - 1 ? 'Activate Protocol' : 'Continue'}
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
