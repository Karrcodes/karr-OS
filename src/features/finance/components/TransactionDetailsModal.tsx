import { useState, useEffect } from 'react'
import { X, Layers, Tag, Calendar, Hash, ArrowUpRight, ArrowDownLeft, Edit2, Check, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Transaction, Pot } from '../types/finance.types'
import { useTransactions } from '../hooks/useTransactions'
import { usePots } from '../hooks/usePots'
import { FINANCE_CATEGORIES, getCategoryById } from '../constants/categories'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'

interface TransactionDetailsModalProps {
    transaction: Transaction | null
    pots: Pot[]
    isOpen: boolean
    onClose: () => void
}

export function TransactionDetailsModal({ transaction, pots, isOpen, onClose }: TransactionDetailsModalProps) {
    const { transactions, updateTransaction, deleteTransaction } = useTransactions()
    const { updatePot } = usePots()
    const { settings } = useSystemSettings()
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        description: '',
        amount: 0,
        category: 'other',
        pocket_id: '' as string | null
    })

    useEffect(() => {
        if (transaction) {
            setEditForm({
                description: transaction.description || '',
                amount: transaction.amount || 0,
                category: transaction.category || 'other',
                pocket_id: transaction.pocket_id
            })
            setIsEditing(false)
        }
    }, [transaction])

    if (!isOpen || !transaction) return null

    const potName = pots.find(p => p.id === transaction.pocket_id)?.name || 'General'

    const handleSave = async () => {
        if (!transaction) return

        const delta = editForm.amount - (transaction.amount || 0)
        const oldPocketId = transaction.pocket_id
        const newPocketId = editForm.pocket_id === 'general' ? null : editForm.pocket_id

        // 1. Handle Pot Balance Update
        if (oldPocketId === newPocketId && oldPocketId && delta !== 0) {
            // Same pot, amount changed
            const pot = pots.find(p => p.id === oldPocketId)
            if (pot) {
                const modifier = (transaction.type === 'spend' || transaction.type === 'transfer') ? -1 : 1
                const newBalance = (pot.balance || 0) + (delta * modifier)
                await updatePot(oldPocketId, { balance: newBalance })
            }
        } else if (oldPocketId !== newPocketId) {
            // Pot changed
            if (oldPocketId) {
                // Revert old pot
                const oldPot = pots.find(p => p.id === oldPocketId)
                if (oldPot) {
                    const modifier = (transaction.type === 'spend' || transaction.type === 'transfer') ? 1 : -1
                    const revertedBalance = (oldPot.balance || 0) + (transaction.amount * modifier)
                    await updatePot(oldPocketId, { balance: revertedBalance })
                }
            }
            if (newPocketId) {
                // Apply to new pot
                const newPot = pots.find(p => p.id === newPocketId)
                if (newPot) {
                    const modifier = (transaction.type === 'spend' || transaction.type === 'transfer') ? -1 : 1
                    const newBalance = (newPot.balance || 0) + (editForm.amount * modifier)
                    await updatePot(newPocketId, { balance: newBalance })
                }
            }
        }

        // 2. Update Transaction
        await updateTransaction(transaction.id, {
            description: editForm.description,
            amount: editForm.amount,
            category: editForm.category,
            pocket_id: newPocketId
        })

        // 3. Heuristic: Seek and update paired transfer if exists
        if (delta !== 0 && (transaction.type === 'transfer' || transaction.type === 'allocate')) {
            const reciprocalType = transaction.type === 'transfer' ? 'allocate' : 'transfer'

            let paired: Transaction | null = null
            if (settings.is_demo_mode) {
                paired = transactions.find(t =>
                    t.date === transaction.date &&
                    t.amount === transaction.amount &&
                    t.type === reciprocalType &&
                    t.id !== transaction.id
                ) || null
            } else {
                const { data } = await supabase
                    .from('fin_transactions')
                    .select('*')
                    .eq('date', transaction.date)
                    .eq('amount', transaction.amount)
                    .eq('type', reciprocalType)
                    .neq('id', transaction.id)
                    .maybeSingle()
                paired = data
            }

            if (paired) {
                // Update and sync its pot
                await updateTransaction(paired.id, { amount: editForm.amount })
                if (paired.pocket_id) {
                    const pairedPot = pots.find(p => p.id === paired.pocket_id)
                    if (pairedPot) {
                        const modifier = (paired.type === 'spend' || paired.type === 'transfer') ? -1 : 1
                        const newBalance = (pairedPot.balance || 0) + (delta * modifier)
                        await updatePot(paired.pocket_id, { balance: newBalance })
                    }
                }
            }
        }

        setIsEditing(false)
        onClose()
    }

    const handleDelete = async () => {
        if (!transaction) return
        if (confirm('Are you sure you want to delete this transaction?')) {
            // Revert pot balance before deletion
            if (transaction.pocket_id) {
                const pot = pots.find(p => p.id === transaction.pocket_id)
                if (pot) {
                    const modifier = (transaction.type === 'spend' || transaction.type === 'transfer') ? 1 : -1
                    const revertedBalance = (pot.balance || 0) + (transaction.amount * modifier)
                    await updatePot(transaction.pocket_id, { balance: revertedBalance })
                }
            }

            // Heuristic cleanup for transfers
            if (transaction.type === 'transfer' || transaction.type === 'allocate') {
                const reciprocalType = transaction.type === 'transfer' ? 'allocate' : 'transfer'

                let paired: Transaction | null = null
                if (settings.is_demo_mode) {
                    paired = transactions.find(t =>
                        t.date === transaction.date &&
                        t.amount === transaction.amount &&
                        t.type === reciprocalType &&
                        t.id !== transaction.id
                    ) || null
                } else {
                    const { data } = await supabase
                        .from('fin_transactions')
                        .select('*')
                        .eq('date', transaction.date)
                        .eq('amount', transaction.amount)
                        .eq('type', reciprocalType)
                        .neq('id', transaction.id)
                        .maybeSingle()
                    paired = data
                }

                if (paired) {
                    // Revert paired pot too
                    if (paired.pocket_id) {
                        const pairedPot = pots.find(p => p.id === paired.pocket_id)
                        if (pairedPot) {
                            const modifier = (paired.type === 'spend' || paired.type === 'transfer') ? 1 : -1
                            const revertedBalance = (pairedPot.balance || 0) + (paired.amount * modifier)
                            await updatePot(paired.pocket_id, { balance: revertedBalance })
                        }
                    }
                    await deleteTransaction(paired.id)
                }
            }

            await deleteTransaction(transaction.id)
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pointer-events-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                <div className="absolute top-5 right-5 flex gap-2">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                        >
                            <Edit2 className="w-4 h-4 text-black/60" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#059669]/10 hover:bg-[#059669]/20 transition-colors"
                        >
                            <Check className="w-4 h-4 text-[#059669]" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                    >
                        <X className="w-4 h-4 text-black/60" />
                    </button>
                </div>

                <div className="pr-10 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-black/[0.03] border border-black/[0.05] flex items-center justify-center text-2xl shrink-0 shadow-sm">
                            {transaction.category ? getCategoryById(transaction.category).emoji : (transaction.emoji || '💸')}
                        </div>
                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        value={editForm.description}
                                        onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="text-[18px] font-bold text-black border-b border-black/10 focus:border-black outline-none w-full bg-transparent"
                                        placeholder="Description"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-[15px] font-black">£</span>
                                        <input
                                            type="number"
                                            value={editForm.amount}
                                            onChange={e => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                            className="text-[15px] font-black border-b border-black/10 focus:border-black outline-none w-full bg-transparent"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-[18px] font-bold text-black leading-tight truncate">{transaction.description || 'Transaction'}</h2>
                                    <p className={`text-[15px] font-black ${transaction.type === 'spend' ? 'text-black' : 'text-[#059669]'}`}>
                                        {transaction.type === 'spend' ? '-' : '+'}£{transaction.amount.toFixed(2)}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                        <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4 text-black/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-black/40 mb-0.5">Budget Pocket</p>
                            {isEditing ? (
                                <select
                                    value={editForm.pocket_id || 'general'}
                                    onChange={e => setEditForm(prev => ({ ...prev, pocket_id: e.target.value }))}
                                    className="text-[14px] font-semibold text-black bg-transparent w-full outline-none"
                                >
                                    <option value="general">General</option>
                                    {pots.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-[14px] font-semibold text-black truncate">{potName}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                        <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4 text-black/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-black/40 mb-0.5">Category</p>
                            {isEditing ? (
                                <select
                                    value={editForm.category}
                                    onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                                    className="text-[14px] font-semibold text-black bg-transparent w-full outline-none capitalize"
                                >
                                    {FINANCE_CATEGORIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <p className="text-[14px] font-semibold text-black">{transaction.category ? getCategoryById(transaction.category).label : 'Other'}</p>
                                    {transaction.provider === 'apple_pay' && (
                                        <span className="text-[9px] font-bold text-black/40 bg-black/5 px-1.5 py-0.5 rounded border border-black/10 tracking-widest uppercase">AI Deduced</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                            <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-black/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-black/40 mb-0.5">Date</p>
                                <p className="text-[13px] font-semibold text-black truncate">
                                    {new Date(transaction.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                            <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                                {transaction.type === 'transfer' ? <ArrowUpRight className="w-4 h-4 text-blue-500" /> :
                                    transaction.type === 'allocate' ? <ArrowDownLeft className="w-4 h-4 text-[#059669]" /> :
                                        <Hash className="w-4 h-4 text-black/50" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-black/40 mb-0.5">Type</p>
                                <p className="text-[13px] font-semibold text-black capitalize truncate">{transaction.type}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between">
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-wider"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>
                    {transaction.provider && (
                        <p className="text-[10px] uppercase tracking-wider font-bold text-black/30">
                            Source: {transaction.provider.replace('_', ' ')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
