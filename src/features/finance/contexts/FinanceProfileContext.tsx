'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type ProfileType = 'personal' | 'business'

interface FinanceProfileContextType {
    activeProfile: ProfileType
    setProfile: (profile: ProfileType) => void
    isPrivacyEnabled: boolean
    togglePrivacy: () => void
    refreshTrigger: number
    lastRefresh: Date
    globalRefresh: () => void
}

const FinanceProfileContext = createContext<FinanceProfileContextType | undefined>(undefined)

export function FinanceProfileProvider({ children }: { children: React.ReactNode }) {
    const [activeProfile, setActiveProfile] = useState<ProfileType>('personal')
    const [isPrivacyEnabled, setIsPrivacyEnabled] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [lastRefresh, setLastRefresh] = useState(new Date())

    useEffect(() => {
        const saved = localStorage.getItem('karrOS_finance_profile') as ProfileType
        if (saved && (saved === 'personal' || saved === 'business')) {
            setActiveProfile(saved)
        }
        const savedPrivacy = localStorage.getItem('karrOS_finance_privacy')
        if (savedPrivacy === 'true') {
            setIsPrivacyEnabled(true)
        }
        setMounted(true)

        // Global Auto-Refresh: Increment trigger every 3 minutes (180,000 ms)
        const interval = setInterval(() => {
            setRefreshTrigger(prev => prev + 1)
            setLastRefresh(new Date())
            console.log('KarrOS: Global financial data auto-refresh triggered.')
        }, 180000)

        return () => clearInterval(interval)
    }, [])

    const handleSetProfile = (profile: ProfileType) => {
        setActiveProfile(profile)
        localStorage.setItem('karrOS_finance_profile', profile)
        // Manual profile switch also triggers a fresh fetch implicitly by hook dependencies,
        // but let's increment refresh just in case.
        setRefreshTrigger(prev => prev + 1)
        setLastRefresh(new Date())
    }

    const togglePrivacy = () => {
        setIsPrivacyEnabled(prev => {
            const next = !prev
            localStorage.setItem('karrOS_finance_privacy', String(next))
            return next
        })
    }

    // Prevent hydration mismatch by optionally rendering children only after mount, 
    // or just assume we have 'personal' first.
    // For seamless UX, we render children immediately but with default 'personal' state,
    // which quickly hydrates from localStorage.
    return (
        <FinanceProfileContext.Provider value={{
            activeProfile,
            setProfile: handleSetProfile,
            isPrivacyEnabled,
            togglePrivacy,
            refreshTrigger,
            lastRefresh,
            globalRefresh: () => {
                setRefreshTrigger(prev => prev + 1)
                setLastRefresh(new Date())
            }
        }}>
            <div className={`${mounted ? "" : "hidden"} ${isPrivacyEnabled ? 'privacy-enabled' : ''}`}>
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
