'use client'

import { useState } from 'react'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function useBank() {
    const [loading, setLoading] = useState(false)
    const { activeProfile } = useFinanceProfile()

    const connectBank = async (institutionId: string = 'revolut_gb') => {
        setLoading(true)
        try {
            const res = await fetch('/api/finance/bank/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institution_id: institutionId, profile: activeProfile })
            })
            const data = await res.json()
            if (data.link) {
                window.location.href = data.link
            } else {
                throw new Error(data.error || 'Failed to get connection link')
            }
        } catch (error) {
            console.error('Bank Connection Error:', error)
            alert('Failed to initiate bank connection')
        } finally {
            setLoading(false)
        }
    }

    const syncTransactions = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/finance/bank/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: activeProfile })
            })
            const data = await res.json()
            if (data.success) {
                return data.count
            } else {
                throw new Error(data.error || 'Sync failed')
            }
        } catch (error) {
            console.error('Bank Sync Error:', error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    return {
        connectBank,
        syncTransactions,
        loading
    }
}
