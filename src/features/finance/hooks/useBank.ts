'use client'

import { useState } from 'react'
import { useFinanceProfile } from '../contexts/FinanceProfileContext'

export function useBank() {
    const [loading, setLoading] = useState(false)
    const { activeProfile } = useFinanceProfile()

    const syncTransactions = async () => {
        // This is now handled by the RevolutImportModal
        // We just provide a loading state if needed elsewhere
        return 0
    }

    return {
        syncTransactions,
        loading
    }
}
