import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { StudioProject, StudioSpark, StudioMilestone } from '../types/studio.types';

export function useStudio() {
    const [projects, setProjects] = useState<StudioProject[]>([]);
    const [sparks, setSparks] = useState<StudioSpark[]>([]);
    const [milestones, setMilestones] = useState<StudioMilestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            const [projectsRes, sparksRes, milestonesRes] = await Promise.all([
                supabase.from('studio_projects').select('*').order('created_at', { ascending: false }),
                supabase.from('studio_sparks').select('*').order('created_at', { ascending: false }),
                supabase.from('studio_milestones').select('*').order('created_at', { ascending: true })
            ]);

            if (projectsRes.error) throw projectsRes.error;
            if (sparksRes.error) throw sparksRes.error;
            if (milestonesRes.error) throw milestonesRes.error;

            setProjects(projectsRes.data || []);
            setSparks(sparksRes.data || []);
            setMilestones(milestonesRes.data || []);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching studio data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addProject = async (project: Partial<StudioProject>) => {
        const { data, error } = await supabase
            .from('studio_projects')
            .insert([project])
            .select()
            .single();

        if (error) throw error;
        setProjects(prev => [data, ...prev]);
        return data;
    };

    const updateProject = async (id: string, updates: Partial<StudioProject>) => {
        const { data, error } = await supabase
            .from('studio_projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        setProjects(prev => prev.map(p => p.id === id ? data : p));
        return data;
    };

    const deleteProject = async (id: string) => {
        const { error } = await supabase.from('studio_projects').delete().eq('id', id);
        if (error) throw error;
        setProjects(prev => prev.filter(p => p.id !== id));
    };

    const addSpark = async (spark: Partial<StudioSpark>) => {
        const { data, error } = await supabase
            .from('studio_sparks')
            .insert([spark])
            .select()
            .single();

        if (error) throw error;
        setSparks(prev => [data, ...prev]);
        return data;
    };

    const updateSpark = async (id: string, updates: Partial<StudioSpark>) => {
        const { data, error } = await supabase
            .from('studio_sparks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        setSparks(prev => prev.map(s => s.id === id ? data : s));
        return data;
    };

    const deleteSpark = async (id: string) => {
        const { error } = await supabase.from('studio_sparks').delete().eq('id', id);
        if (error) throw error;
        setSparks(prev => prev.filter(s => s.id !== id));
    };

    const addMilestone = async (milestone: Partial<StudioMilestone>) => {
        const { data, error } = await supabase
            .from('studio_milestones')
            .insert([milestone])
            .select()
            .single();

        if (error) throw error;
        setMilestones(prev => [...prev, data]);
        return data;
    };

    const updateMilestone = async (id: string, updates: Partial<StudioMilestone>) => {
        const { data, error } = await supabase
            .from('studio_milestones')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        setMilestones(prev => prev.map(m => m.id === id ? data : m));
        return data;
    };

    const deleteMilestone = async (id: string) => {
        const { error } = await supabase.from('studio_milestones').delete().eq('id', id);
        if (error) throw error;
        setMilestones(prev => prev.filter(m => m.id !== id));
    };

    return {
        projects,
        sparks,
        milestones,
        loading,
        error,
        refresh: fetchData,
        addProject,
        updateProject,
        deleteProject,
        addSpark,
        updateSpark,
        deleteSpark,
        addMilestone,
        updateMilestone,
        deleteMilestone
    };
}
