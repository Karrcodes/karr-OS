'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { StudioProject, StudioSpark, StudioMilestone } from '../types/studio.types'

interface StudioContextType {
    projects: StudioProject[]
    sparks: StudioSpark[]
    milestones: StudioMilestone[]
    loading: boolean
    error: string | null
    refresh: () => Promise<void>
    addProject: (project: Partial<StudioProject>) => Promise<StudioProject>
    updateProject: (id: string, updates: Partial<StudioProject>) => Promise<StudioProject>
    deleteProject: (id: string) => Promise<void>
    addSpark: (spark: Partial<StudioSpark>) => Promise<StudioSpark>
    updateSpark: (id: string, updates: Partial<StudioSpark>) => Promise<StudioSpark>
    deleteSpark: (id: string) => Promise<void>
    addMilestone: (milestone: Partial<StudioMilestone>) => Promise<StudioMilestone>
    updateMilestone: (id: string, updates: Partial<StudioMilestone>) => Promise<StudioMilestone>
    deleteMilestone: (id: string) => Promise<void>
}

const StudioContext = createContext<StudioContextType | undefined>(undefined)

export function StudioProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<StudioProject[]>([])
    const [sparks, setSparks] = useState<StudioSpark[]>([])
    const [milestones, setMilestones] = useState<StudioMilestone[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [projectsRes, sparksRes, milestonesRes] = await Promise.all([
                supabase.from('studio_projects').select('*').order('created_at', { ascending: false }),
                supabase.from('studio_sparks').select('*').order('created_at', { ascending: false }),
                supabase.from('studio_milestones').select('*').order('created_at', { ascending: true })
            ])

            if (projectsRes.error) throw projectsRes.error
            if (sparksRes.error) throw sparksRes.error
            if (milestonesRes.error) throw milestonesRes.error

            setProjects(projectsRes.data || [])
            setSparks(sparksRes.data || [])
            setMilestones(milestonesRes.data || [])
            setError(null)
        } catch (err: any) {
            console.error('Error fetching studio data:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const addProject = async (project: Partial<StudioProject>) => {
        const { data, error } = await supabase.from('studio_projects').insert([project]).select()
        if (error) throw error
        const inserted = data?.[0]
        if (!inserted) throw new Error('No data returned')
        setProjects(prev => [inserted, ...prev])
        return inserted
    }

    const updateProject = async (id: string, updates: Partial<StudioProject>) => {
        if (!updates || Object.keys(updates).length === 0) return projects.find(p => p.id === id)!
        const { data, error } = await supabase.from('studio_projects').update(updates).eq('id', id).select()
        if (error) throw error
        const updated = data?.[0]
        if (!updated) throw new Error('Update failed')
        setProjects(prev => prev.map(p => p.id === id ? updated : p))
        return updated
    }

    const deleteProject = async (id: string) => {
        const { error } = await supabase.from('studio_projects').delete().eq('id', id)
        if (error) throw error
        setProjects(prev => prev.filter(p => p.id !== id))
    }

    const addSpark = async (spark: Partial<StudioSpark>) => {
        const { data, error } = await supabase.from('studio_sparks').insert([spark]).select()
        if (error) throw error
        const inserted = data?.[0]
        if (!inserted) throw new Error('No data returned')
        setSparks(prev => [inserted, ...prev])
        return inserted
    }

    const updateSpark = async (id: string, updates: Partial<StudioSpark>) => {
        if (!updates || Object.keys(updates).length === 0) return sparks.find(s => s.id === id)!
        const { data, error } = await supabase.from('studio_sparks').update(updates).eq('id', id).select()
        if (error) throw error
        const updated = data?.[0]
        if (!updated) throw new Error('Update failed')
        setSparks(prev => prev.map(s => s.id === id ? updated : s))
        return updated
    }

    const deleteSpark = async (id: string) => {
        const { error } = await supabase.from('studio_sparks').delete().eq('id', id)
        if (error) throw error
        setSparks(prev => prev.filter(s => s.id !== id))
    }

    const addMilestone = async (milestone: Partial<StudioMilestone>) => {
        const { data, error } = await supabase.from('studio_milestones').insert([milestone]).select()
        if (error) throw error
        const inserted = data?.[0]
        if (!inserted) throw new Error('No data returned')
        setMilestones(prev => [...prev, inserted])
        return inserted
    }

    const updateMilestone = async (id: string, updates: Partial<StudioMilestone>) => {
        if (!updates || Object.keys(updates).length === 0) return milestones.find(m => m.id === id)!
        const { data, error } = await supabase.from('studio_milestones').update(updates).eq('id', id).select()
        if (error) throw error
        const updated = data?.[0]
        if (!updated) throw new Error('Update failed')
        setMilestones(prev => prev.map(m => m.id === id ? updated : m))
        return updated
    }

    const deleteMilestone = async (id: string) => {
        const { error } = await supabase.from('studio_milestones').delete().eq('id', id)
        if (error) throw error
        setMilestones(prev => prev.filter(m => m.id !== id))
    }

    return (
        <StudioContext.Provider value={{
            projects, sparks, milestones, loading, error,
            refresh: fetchData,
            addProject, updateProject, deleteProject,
            addSpark, updateSpark, deleteSpark,
            addMilestone, updateMilestone, deleteMilestone
        }}>
            {children}
        </StudioContext.Provider>
    )
}

export function useStudioContext() {
    const context = useContext(StudioContext)
    if (context === undefined) {
        throw new Error('useStudioContext must be used within a StudioProvider')
    }
    return context
}
