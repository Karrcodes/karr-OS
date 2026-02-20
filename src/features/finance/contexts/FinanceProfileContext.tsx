'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type ProfileType = 'personal' | 'business'

interface FinanceProfileContextType {
    activeProfile: ProfileType
    setProfile: (profile: ProfileType) => void
}

const FinanceProfileContext = createContext<FinanceProfileContextType | undefined>(undefined)

export function FinanceProfileProvider({ children }: { children: React.ReactNode }) {
    const [activeProfile, setActiveProfile] = useState<ProfileType>('personal')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem('karrOS_finance_profile') as ProfileType
        if (saved && (saved === 'personal' || saved === 'business')) {
            setActiveProfile(saved)
        }
        setMounted(true)
    }, [])

    const handleSetProfile = (profile: ProfileType) => {
        setActiveProfile(profile)
        localStorage.setItem('karrOS_finance_profile', profile)
    }

    // Prevent hydration mismatch by optionally rendering children only after mount, 
    // or just assume we have 'personal' first.
    // For seamless UX, we render children immediately but with default 'personal' state,
    // which quickly hydrates from localStorage.
    return (
        <FinanceProfileContext.Provider value={{ activeProfile, setProfile: handleSetProfile }}>
            <div className={mounted ? "" : "hidden"}>
                {children}
            </div>
        </FinanceProfileContext.Provider>
    )
}

export function useFinanceProfile() {
    const context = useContext(FinanceProfileContext)
    if (context === undefined) {
        throw new Error('useFinanceProfile must be used within a FinanceProfileProvider')
    }
    return context
}
