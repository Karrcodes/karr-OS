'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Eye, EyeOff, Copy, Trash2, Plus, Key, User, Globe, FileText, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { MOCK_VAULT } from '@/lib/demoData'

interface Secret {
    id: string
    service: string
    username: string | null
    password: string
    notes: string | null
    created_at: string
}

export function SecretsManager() {
    const [secrets, setSecrets] = useState<Secret[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const { settings } = useSystemSettings()

    // Form state
    const [newSecret, setNewSecret] = useState({
        service: '',
        username: '',
        password: '',
        notes: ''
    })

    const fetchSecrets = useCallback(async () => {
        if (settings.is_demo_mode) {
            setSecrets(MOCK_VAULT.secrets as any)
            setLoading(false)
            return
        }
        setLoading(true)
        const { data, error } = await supabase
            .from('sys_secrets')
            .select('*')
            .order('service', { ascending: true })

        if (!error && data) {
            setSecrets(data)
        }
        setLoading(false)
    }, [settings.is_demo_mode])

    useEffect(() => {
        fetchSecrets()
    }, [fetchSecrets])

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSecret.service || !newSecret.password) return

        const { error } = await supabase
            .from('sys_secrets')
            .insert([{
                service: newSecret.service,
                username: newSecret.username || null,
                password: newSecret.password,
                notes: newSecret.notes || null,
                profile: 'personal' // Default to personal
            }])

        if (!error) {
            setNewSecret({ service: '', username: '', password: '', notes: '' })
            setAdding(false)
            fetchSecrets()
        }
    }

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('sys_secrets')
            .delete()
            .eq('id', id)

        if (!error) {
            fetchSecrets()
        }
    }

    const togglePassword = (id: string) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const copyToClipboard = (text: string, id: string, type: 'user' | 'pass') => {
        navigator.clipboard.writeText(text)
        setCopiedId(`${id}-${type}`)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-black flex items-center gap-2">
                        <span>🔐</span> Secrets
                    </h2>
                    <p className="text-[12px] text-black/40">Manage your passwords and sensitive access details</p>
                </div>
                <button
                    onClick={() => setAdding(!adding)}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[13px] font-bold hover:bg-black/80 transition-all shadow-sm active:scale-95"
                >
                    {adding ? 'Cancel' : (
                        <>
                            <Plus className="w-4 h-4" />
                            <span>Add Secret</span>
                        </>
                    )}
                </button>
            </div>

            {adding && (
                <div className="bg-white border border-black/[0.08] rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-black/40 uppercase tracking-wider ml-1">Service / App</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. Netflix, GitHub"
                                        value={newSecret.service}
                                        onChange={e => setNewSecret({ ...newSecret, service: e.target.value })}
                                        className="w-full bg-black/[0.02] border border-black/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-black/40 uppercase tracking-wider ml-1">Username / Email</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                    <input
                                        type="text"
                                        placeholder="Username or email"
                                        value={newSecret.username}
                                        onChange={e => setNewSecret({ ...newSecret, username: e.target.value })}
                                        className="w-full bg-black/[0.02] border border-black/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-black/40 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
                                <input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={newSecret.password}
                                    onChange={e => setNewSecret({ ...newSecret, password: e.target.value })}
                                    className="w-full bg-black/[0.02] border border-black/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-black/40 uppercase tracking-wider ml-1">Notes (Optional)</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-4 h-4 text-black/20" />
                                <textarea
                                    placeholder="Any additional info..."
                                    value={newSecret.notes}
                                    onChange={e => setNewSecret({ ...newSecret, notes: e.target.value })}
                                    rows={2}
                                    className="w-full bg-black/[0.02] border border-black/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-black/5 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-black text-white rounded-xl text-[14px] font-bold hover:bg-black/90 transition-all shadow-md active:scale-[0.98]"
                        >
                            Save Secret
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white border border-black/[0.08] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/[0.04] bg-black/[0.01]">
                                <th className="px-5 py-4 text-[11px] font-bold text-black/30 uppercase tracking-widest w-1/4">Service</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-black/30 uppercase tracking-widest w-1/4">User/Email</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-black/30 uppercase tracking-widest w-1/4">Password</th>
                                <th className="px-5 py-4 text-[11px] font-bold text-black/30 uppercase tracking-widest w-1/4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.03]">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-6 h-6 animate-spin text-black/20" />
                                            <p className="text-[13px] font-medium text-black/30">Loading your secrets...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : secrets.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-black/[0.03] flex items-center justify-center">
                                                <Key className="w-6 h-6 text-black/10" />
                                            </div>
                                            <p className="text-[13px] font-medium text-black/30">No secrets stored yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                secrets.map(secret => (
                                    <tr key={secret.id} className="group hover:bg-black/[0.01] transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center text-[14px]">
                                                    {secret.service[0]?.toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-black">{secret.service}</span>
                                                    {secret.notes && <span className="text-[11px] text-black/35 truncate max-w-[150px]">{secret.notes}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-medium text-black/60 truncate max-w-[180px]">
                                                    {secret.username || '—'}
                                                </span>
                                                {secret.username && (
                                                    <button
                                                        onClick={() => copyToClipboard(secret.username!, secret.id, 'user')}
                                                        className="p-1.5 rounded-md hover:bg-black/[0.05] text-black/20 hover:text-black transition-all"
                                                        title="Copy Username"
                                                    >
                                                        {copiedId === `${secret.id}-user` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[13px] font-mono tracking-wider ${visiblePasswords[secret.id] ? 'text-black' : 'text-black/20'}`}>
                                                    {visiblePasswords[secret.id] ? secret.password : '••••••••••••'}
                                                </span>
                                                <div className="flex items-center gap-0.5 ml-auto">
                                                    <button
                                                        onClick={() => togglePassword(secret.id)}
                                                        className="p-1.5 rounded-md hover:bg-black/[0.05] text-black/20 hover:text-black transition-all"
                                                        title={visiblePasswords[secret.id] ? "Hide Password" : "Show Password"}
                                                    >
                                                        {visiblePasswords[secret.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(secret.password, secret.id, 'pass')}
                                                        className="p-1.5 rounded-md hover:bg-black/[0.05] text-black/20 hover:text-black transition-all"
                                                        title="Copy Password"
                                                    >
                                                        {copiedId === `${secret.id}-pass` ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(secret.id)}
                                                className="p-2 rounded-lg text-red-500/30 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Secret"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
