'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface VaultContextType {
    isVaultPrivate: boolean
    toggleVaultPrivacy: () => void
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export function VaultProvider({ children }: { children: React.ReactNode }) {
    const [isVaultPrivate, setIsVaultPrivate] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const savedPrivacy = localStorage.getItem('karrOS_vault_privacy')
        if (savedPrivacy === 'true') {
            setIsVaultPrivate(true)
        }
        setMounted(true)
    }, [])

    const toggleVaultPrivacy = () => {
        setIsVaultPrivate(prev => {
            const next = !prev
            localStorage.setItem('karrOS_vault_privacy', String(next))
            return next
        })
    }

    return (
        <VaultContext.Provider value={{
            isVaultPrivate,
            toggleVaultPrivacy
        }}>
            <div className={isVaultPrivate ? 'privacy-enabled' : ''}>
                {children}
            </div>
        </VaultContext.Provider>
    )
}

export function useVault() {
    const context = useContext(VaultContext)
    if (context === undefined) {
        throw new Error('useVault must be used within a VaultProvider')
    }
    return context
}
