'use client'

import { useState } from 'react'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function useBank() {
    const [loading, setLoading] = useState(false)
    const { activeProfile, refreshTrigger, globalRefresh } = useFinanceProfile()

    const startConnection = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/finance/bank/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: activeProfile })
            })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error(data.error || 'Failed to start connection')
            }
        } catch (error) {
            console.error('Bank connection error:', error)
            alert('Failed to connect to bank. Check your Salt Edge API keys.')
        } finally {
            setLoading(false)
        }
    }

    const syncTransactions = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/finance/bank/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profile: activeProfile })
            })
            const data = await response.json()
            if (data.success) {
                globalRefresh()
                return data.count
            } else {
                throw new Error(data.error || 'Sync failed')
            }
        } catch (error) {
            console.error('Bank sync error:', error)
            return 0
        } finally {
            setLoading(false)
        }
    }

    return {
        startConnection,
        syncTransactions,
        loading
    }
}
