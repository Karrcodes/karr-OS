'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, User, Bell, Monitor, Shield, Save, Check, RefreshCw, Sun, Moon, Smartphone, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'
import { KarrFooter } from '@/components/KarrFooter'
import { subscribeToPushNotifications } from '@/lib/notifications'

export default function SettingsPage() {
    const { settings, updateSetting, loading: contextLoading } = useSystemSettings()
    const { isPrivacyEnabled, togglePrivacy } = useFinanceProfile()
    const [isSaving, setIsSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)

    // Local state for form fields
    const [userName, setUserName] = useState(settings.user_name || '')
    const [userEmail, setUserEmail] = useState(settings.user_email || '')
    const [profilePic, setProfilePic] = useState(settings.profile_picture_url || '')
    const [offDays, setOffDays] = useState<string[]>(settings.off_days || [])

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // Sync local state when context settings load
    useEffect(() => {
        setUserName(settings.user_name || '')
        setUserEmail(settings.user_email || '')
        setProfilePic(settings.profile_picture_url || '')
        setOffDays(settings.off_days || [])
    }, [settings])

    const handleSaveProfile = async () => {
        setIsSaving(true)
        try {
            await updateSetting('user_name', userName)
            await updateSetting('user_email', userEmail)
            await updateSetting('profile_picture_url', profilePic)
            await updateSetting('off_days', offDays)
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 2000)
        } catch (error) {
            console.error('Failed to save settings:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const toggleOffDay = (day: string) => {
        setOffDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        )
    }

    const toggleNotification = async (key: string, current: boolean) => {
        try {
            await updateSetting(key as any, !current)
        } catch (error) {
            console.error(`Failed to toggle ${key}:`, error)
        }
    }

    if (contextLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#fafafa]">
                <RefreshCw className="w-6 h-6 text-black/20 animate-spin" />
            </div>
        )
    }

    return (
        <div className="h-screen bg-[#fafafa] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-black/[0.06] px-4 py-4 z-20 shadow-sm flex-shrink-0">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <a href="/system/control-centre" className="w-9 h-9 rounded-xl bg-black/[0.03] flex items-center justify-center hover:bg-black/[0.06] transition-colors">
                            <ArrowLeft className="w-4 h-4 text-black/40" />
                        </a>
                        <div>
                            <h1 className="text-[18px] font-bold text-black tracking-tight">System Settings</h1>
                            <p className="text-[11px] text-black/35 mt-0.5">Manage your KarrOS preferences</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
                <div className="w-full max-w-4xl space-y-6">

                    {/* Profile Section */}
                    <section className="bg-white rounded-3xl border border-black/[0.06] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-black/[0.04] bg-black/[0.01] flex items-center gap-2">
                            <User className="w-4 h-4 text-black/40" />
                            <h2 className="text-[13px] font-bold text-black uppercase tracking-wider">Profile</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                <div className="w-20 h-20 rounded-3xl bg-black/5 border border-black/10 flex items-center justify-center shrink-0 overflow-hidden relative group">
                                    {profilePic ? (
                                        <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-8 h-8 text-black/20" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-black/40 ml-1">Display Name</label>
                                            <input
                                                type="text"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                                className="w-full bg-black/[0.03] border border-black/[0.06] rounded-xl px-4 py-2 text-[13px] outline-none focus:border-black/30 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-black/40 ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                value={userEmail}
                                                onChange={(e) => setUserEmail(e.target.value)}
                                                className="w-full bg-black/[0.03] border border-black/[0.06] rounded-xl px-4 py-2 text-[13px] outline-none focus:border-black/30 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-black/40 ml-1">Profile Picture URL</label>
                                        <input
                                            type="text"
                                            value={profilePic}
                                            onChange={(e) => setProfilePic(e.target.value)}
                                            placeholder="Paste image URL here..."
                                            className="w-full bg-black/[0.03] border border-black/[0.06] rounded-xl px-4 py-2 text-[13px] outline-none focus:border-black/30 transition-colors"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="bg-black text-white px-6 py-2 rounded-xl text-[13px] font-bold hover:bg-black/80 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-black/10 active:scale-95"
                                        >
                                            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            {saveSuccess ? 'Saved!' : (isSaving ? 'Saving...' : 'Save Profile')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Notifications Section */}
                    <section className="bg-white rounded-3xl border border-black/[0.06] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-black/[0.04] bg-black/[0.01] flex items-center gap-2">
                            <Bell className="w-4 h-4 text-black/40" />
                            <h2 className="text-[13px] font-bold text-black uppercase tracking-wider">Notifications</h2>
                        </div>
                        <div className="divide-y divide-black/[0.04]">
                            <NotificationToggle
                                label="Low Balance Alerts"
                                description="Get notified when a pocket drops below £10."
                                active={settings.notification_low_balance}
                                onToggle={() => toggleNotification('notification_low_balance', settings.notification_low_balance)}
                            />
                            <NotificationToggle
                                label="Large Transactions"
                                description="Alert for any transaction over £500."
                                active={settings.notification_large_transaction}
                                onToggle={() => toggleNotification('notification_large_transaction', settings.notification_large_transaction)}
                            />
                            <NotificationToggle
                                label="Bank Sync Status"
                                description="Receive a summary after scheduled bank refreshes."
                                active={settings.notification_bank_sync}
                                onToggle={() => toggleNotification('notification_bank_sync', settings.notification_bank_sync)}
                            />
                            <NotificationToggle
                                label="Goal Achievements"
                                description="Celebrate milestones when reaching savings targets."
                                active={settings.notification_goal_milestone}
                                onToggle={() => toggleNotification('notification_goal_milestone', settings.notification_goal_milestone)}
                            />
                        </div>
                        <div className="p-6 bg-black/[0.02] border-t border-black/[0.04]">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                                        <Smartphone className="w-5 h-5 text-black/40" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-black">iOS / PWA Notifications</p>
                                        <p className="text-[11px] text-black/35">Subscribe this device to receive real-time alerts.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const result = await subscribeToPushNotifications()
                                        if (result.success) {
                                            alert('Device subscribed successfully!')
                                            // Trigger a test notification
                                            fetch('/api/notifications/test', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    title: 'KarrOS',
                                                    body: '🎉 Notifications enabled on this device!',
                                                    url: '/system/settings'
                                                })
                                            })
                                        } else {
                                            alert(`Failed to subscribe: ${result.error || 'Unknown error'}. \n\nChecklist: \n1. Added to Home Screen (iOS)?\n2. Granted permission?\n3. Using HTTPS?`)
                                        }
                                    }}
                                    className="bg-black text-white px-5 py-2 rounded-xl text-[12px] font-bold hover:bg-black/80 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
                                >
                                    Enable on this Device
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Schedule & Reminders */}
                    <section className="bg-white rounded-3xl border border-black/[0.06] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-black/[0.04] bg-black/[0.01] flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-black/40" />
                            <h2 className="text-[13px] font-bold text-black uppercase tracking-wider">Schedule & Reminders</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-[14px] font-bold text-black">Off-Day Schedule</p>
                                <p className="text-[11px] text-black/35 font-medium mb-3">We'll remind you to do your finances on the first day of your weekend.</p>
                                <div className="flex flex-wrap gap-2">
                                    {daysOfWeek.map(day => {
                                        const isActive = offDays.includes(day)
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => toggleOffDay(day)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border",
                                                    isActive
                                                        ? "bg-black text-white border-black"
                                                        : "bg-black/[0.02] text-black/40 border-black/[0.06] hover:bg-black/[0.05]"
                                                )}
                                            >
                                                {day.slice(0, 3)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Display & Privacy */}
                    <section className="bg-white rounded-3xl border border-black/[0.06] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-black/[0.04] bg-black/[0.01] flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-black/40" />
                            <h2 className="text-[13px] font-bold text-black uppercase tracking-wider">Display & Privacy</h2>
                        </div>
                        <div className="divide-y divide-black/[0.04]">
                            <div className="p-6 flex items-center justify-between">
                                <div className="min-w-0 pr-4">
                                    <p className="text-[14px] font-bold text-black">Privacy Mode (Global)</p>
                                    <p className="text-[11px] text-black/35 font-medium">Blur sensitive financial data across the entire system.</p>
                                </div>
                                <button
                                    onClick={togglePrivacy}
                                    className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${isPrivacyEnabled ? 'bg-emerald-500' : 'bg-black/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isPrivacyEnabled ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-[14px] font-bold text-black mb-3">System Theme</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <ThemeOption icon={<Monitor className="w-4 h-4" />} label="System" active={true} />
                                    <ThemeOption icon={<Sun className="w-4 h-4" />} label="Light" active={false} />
                                    <ThemeOption icon={<Moon className="w-4 h-4" />} label="Dark" active={false} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Security & Access */}
                    <section className="bg-white rounded-3xl border border-black/[0.06] shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-black/[0.04] bg-black/[0.01] flex items-center gap-2">
                            <Shield className="w-4 h-4 text-black/40" />
                            <h2 className="text-[13px] font-bold text-black uppercase tracking-wider">Security & Access</h2>
                        </div>
                        <div className="p-6 flex items-center justify-between group cursor-pointer hover:bg-black/[0.01] transition-colors">
                            <div>
                                <p className="text-[14px] font-bold text-black">Passcode Lock</p>
                                <p className="text-[11px] text-black/35 font-medium">Currently active for all system modules</p>
                            </div>
                            <div className="px-3 py-1 bg-black/5 rounded-lg text-[10px] font-bold text-black/40 uppercase tracking-widest">Active</div>
                        </div>
                    </section>

                    <KarrFooter />
                </div>
            </div>
        </div>
    )
}

function ThemeOption({ icon, label, active }: { icon: React.ReactNode, label: string, active: boolean }) {
    return (
        <button className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${active ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-black/[0.02] text-black/40 border-black/[0.06] hover:bg-black/[0.05]'}`}>
            {icon}
            <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    )
}

function NotificationToggle({ label, description, active, onToggle }: { label: string, description: string, active: boolean, onToggle: () => void }) {
    return (
        <div className="p-6 flex items-center justify-between">
            <div className="min-w-0 pr-4">
                <p className="text-[14px] font-bold text-black">{label}</p>
                <p className="text-[11px] text-black/35 font-medium">{description}</p>
            </div>
            <button
                onClick={onToggle}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 ${active ? 'bg-black' : 'bg-black/10'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'left-6' : 'left-1'}`} />
            </button>
        </div>
    )
}
