import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { StudioProject, StudioSpark, StudioContent, StudioNetwork } from '../types/studio.types';

export function useStudio() {
    const [projects, setProjects] = useState<StudioProject[]>([]);
    const [sparks, setSparks] = useState<StudioSpark[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // For now fetch projects and active sparks
            const [projectsRes, sparksRes] = await Promise.all([
                supabase.from('studio_projects').select('*').order('created_at', { ascending: false }),
                supabase.from('studio_sparks').select('*').order('created_at', { ascending: false })
            ]);

            if (projectsRes.error) throw projectsRes.error;
            if (sparksRes.error) throw sparksRes.error;

            setProjects(projectsRes.data || []);
            setSparks(sparksRes.data || []);
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

    return {
        projects,
        sparks,
        loading,
        error,
        refresh: fetchData,
        addProject,
        addSpark,
        updateProject
    };
}
