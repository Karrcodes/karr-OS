import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, Bell, Monitor, Shield, Save, Check, RefreshCw, Sun, Moon, Smartphone, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSystemSettings } from '@/features/system/contexts/SystemSettingsContext'
import { useFinanceProfile } from '@/features/finance/contexts/FinanceProfileContext'
import { KarrFooter } from '@/components/KarrFooter'
import { subscribeToPushNotifications, checkPushSubscription, unsubscribeFromPushNotifications } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'
import { Upload, X as CloseIcon } from 'lucide-react'

export default function SettingsPage() {
    const { settings, updateSetting, loading: contextLoading, refreshSettings } = useSystemSettings()
    const { isPrivacyEnabled, togglePrivacy } = useFinanceProfile()
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [checkingSubscription, setCheckingSubscription] = useState(true)

    // Local state for form fields
    const [userName, setUserName] = useState(settings.user_name || '')
    const [userEmail, setUserEmail] = useState(settings.user_email || '')
    const [profilePic, setProfilePic] = useState(settings.profile_picture_url || '')
    const [offDays, setOffDays] = useState<string[]>(settings.off_days || [])
    const [scheduleType, setScheduleType] = useState<'mon-fri' | 'shift'>(settings.schedule_type || 'mon-fri')
    const [shiftOn, setShiftOn] = useState(settings.shift_on_days || 3)
    const [shiftOff, setShiftOff] = useState(settings.shift_off_days || 3)
    const [shiftStart, setShiftStart] = useState(settings.shift_start_date || '')
    const [authorizedDevices, setAuthorizedDevices] = useState<any[]>([])
    const [fetchingDevices, setFetchingDevices] = useState(false)

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // Sync local state when context settings load
    useEffect(() => {
        setUserName(settings.user_name || '')
        setUserEmail(settings.user_email || '')
        setProfilePic(settings.profile_picture_url || '')
        setOffDays(settings.off_days || [])
        setScheduleType(settings.schedule_type || 'mon-fri')
        setShiftOn(settings.shift_on_days || 3)
        setShiftOff(settings.shift_off_days || 3)
        setShiftStart(settings.shift_start_date || '')

        // CHECK PUSH STATUS
        const checkPush = async () => {
            const subscribed = await checkPushSubscription()
            setIsSubscribed(subscribed)
            setCheckingSubscription(false)
        }
        checkPush()
        fetchDevices()
    }, [settings])

    const fetchDevices = async () => {
        setFetchingDevices(true)
        const { data } = await supabase
            .from('fin_authorized_devices')
            .select('*')
            .order('last_used_at', { ascending: false })
        if (data) setAuthorizedDevices(data)
        setFetchingDevices(false)
    }

    const revokeDevice = async (deviceId: string) => {
        const { error } = await supabase
            .from('fin_authorized_devices')
            .delete()
            .eq('device_id', deviceId)

        if (!error) {
            setAuthorizedDevices(prev => prev.filter(d => d.device_id !== deviceId))
            // If current device, force reload
            if (typeof window !== 'undefined' && localStorage.getItem('karrOS_shield_id') === deviceId) {
                localStorage.removeItem('karrOS_unlocked')
                localStorage.removeItem('karrOS_shield_id')
                window.location.reload()
            }
        }
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        try {
            await Promise.all([
                updateSetting('user_name', userName),
                updateSetting('user_email', userEmail),
                updateSetting('profile_picture_url', profilePic)
            ])

            await refreshSettings()
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 2000)
        } catch (error) {
            console.error('Failed to save profile:', error)
            alert('Failed to save profile. Please check RLS policies.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveSchedule = async () => {
        setIsSaving(true)
        try {
            await Promise.all([
                updateSetting('off_days', offDays),
                updateSetting('schedule_type', scheduleType),
                updateSetting('shift_on_days', shiftOn),
                updateSetting('shift_off_days', shiftOff),
                updateSetting('shift_start_date', shiftStart)
            ])

            await refreshSettings()
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 2000)
        } catch (error) {
            console.error('Failed to save schedule:', error)
            alert('Failed to save schedule settings.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `avatar-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('system')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('system')
                .getPublicUrl(filePath)

            setProfilePic(publicUrl)
            // Auto-save the new picture URL
            await updateSetting('profile_picture_url', publicUrl)
        } catch (error: any) {
            console.error('Upload error:', error)
            alert(`Upload failed: ${error.message}`)
        } finally {
            setIsUploading(false)
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
                                        <>
                                            <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <label className="cursor-pointer p-2">
                                                    <Upload className="w-5 h-5 text-white" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/10 transition-colors">
                                            {isUploading ? <RefreshCw className="w-6 h-6 text-black/20 animate-spin" /> : <Upload className="w-6 h-6 text-black/20" />}
                                            <span className="text-[10px] text-black/20 font-bold mt-1">{isUploading ? 'Uploading...' : 'Upload'}</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
                                        </label>
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
                                    <div className="space-y-1.5 opacity-50 grayscale pointer-events-none">
                                        <label className="text-[11px] font-bold text-black/40 ml-1">Profile Picture URL (Stored in Cloud)</label>
                                        <input
                                            type="text"
                                            value={profilePic}
                                            readOnly
                                            className="w-full bg-black/[0.03] border border-black/[0.06] rounded-xl px-4 py-2 text-[13px] outline-none"
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
                                        <p className="text-[11px] text-black/35 font-medium">Receive real-time alerts on this device.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {checkingSubscription ? (
                                        <RefreshCw className="w-4 h-4 text-black/20 animate-spin" />
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                if (isSubscribed) {
                                                    const res = await unsubscribeFromPushNotifications()
                                                    if (res.success) setIsSubscribed(false)
                                                } else {
                                                    const res = await subscribeToPushNotifications()
                                                    if (res.success) {
                                                        setIsSubscribed(true)
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
                                                        alert(`Failed: ${res.error}`)
                                                    }
                                                }
                                            }}
                                            className={cn(
                                                "w-11 h-6 rounded-full transition-all duration-300 relative shrink-0",
                                                isSubscribed ? 'bg-emerald-500' : 'bg-black/10'
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                                                isSubscribed ? 'left-6' : 'left-1'
                                            )} />
                                        </button>
                                    )}
                                    <span className="text-[11px] font-bold text-black/40 uppercase tracking-wider w-12">
                                        {isSubscribed ? 'Active' : 'Off'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-black/[0.04]">
                                <Link
                                    href="/system/notifications"
                                    className="flex items-center justify-between p-3 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center">
                                            <Bell className="w-4 h-4 text-black/60" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-black group-hover:underline">View Notification History</p>
                                            <p className="text-[11px] text-black/40">Review past system alerts</p>
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-black/5 group-hover:bg-black/10">
                                        <ArrowLeft className="w-3 h-3 rotate-180" />
                                    </div>
                                </Link>
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
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[14px] font-bold text-black">Schedule Type</p>
                                <div className="flex bg-black/[0.03] p-1 rounded-xl border border-black/[0.06]">
                                    <button
                                        onClick={() => setScheduleType('mon-fri')}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                            scheduleType === 'mon-fri' ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black/60"
                                        )}
                                    >
                                        Fixed
                                    </button>
                                    <button
                                        onClick={() => setScheduleType('shift')}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                            scheduleType === 'shift' ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black/60"
                                        )}
                                    >
                                        Rotating Shift
                                    </button>
                                </div>
                            </div>

                            {scheduleType === 'mon-fri' ? (
                                <div>
                                    <p className="text-[14px] font-bold text-black mb-1">Off-Day Selection</p>
                                    <p className="text-[11px] text-black/35 font-medium mb-3">Pick your standard weekends for reminders.</p>
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
                            ) : (
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-black/40 ml-1">Days ON</label>
                                            <input
                                                type="number"
                                                value={shiftOn}
                                                onChange={(e) => setShiftOn(parseInt(e.target.value) || 0)}
                                                className="w-full bg-black/[0.03] border border-black/[0.06] rounded-xl px-4 py-2 text-[13px] outline-none focus:border-black/30 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-black/40 ml-1">Days OFF</label>
                                            <input
                                                type="number"
                                                value={shiftOff}
                                                onChange={(e) => setShiftOff(parseInt(e.target.value) || 0)}
                                                className="w-full bg-black/[0.03] border border-black/[0.06] rounded-xl px-4 py-2 text-[13px] outline-none focus:border-black/30 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-black/40 ml-1">Pattern Anchor (Start of an ON block)</label>
                                        <input
                                            type="date"
                                            value={shiftStart}
                                            onChange={(e) => setShiftStart(e.target.value)}
                                            className="w-full min-w-0 appearance-none flex flex-row items-center bg-black/[0.03] border border-black/[0.06] rounded-xl px-4 py-2 text-[13px] outline-none focus:border-black/30 transition-colors [color-scheme:light]"
                                        />
                                        <p className="text-[10px] text-black/35 mt-1 px-1 italic">We'll remind you on the first "OFF" day in every cycle.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSaveSchedule}
                                    disabled={isSaving}
                                    className="bg-black text-white px-6 py-2 rounded-xl text-[13px] font-bold hover:bg-black/80 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-black/10 active:scale-95"
                                >
                                    {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saveSuccess ? 'Saved!' : (isSaving ? 'Saving...' : 'Save Schedule')}
                                </button>
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
                            <h2 className="text-[13px] font-bold text-black uppercase tracking-wider">Security & Authorized Devices</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Device List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[14px] font-bold text-black">Linked Devices</p>
                                    <button
                                        onClick={fetchDevices}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 text-black/20 hover:text-black transition-colors"
                                    >
                                        <RefreshCw className={cn("w-3.5 h-3.5", fetchingDevices && "animate-spin")} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {authorizedDevices.map(device => {
                                        const isThisDevice = typeof window !== 'undefined' && localStorage.getItem('karrOS_shield_id') === device.device_id
                                        return (
                                            <div key={device.id} className="flex items-center justify-between p-3 rounded-2xl bg-black/[0.02] border border-black/[0.04] transition-all hover:border-black/[0.08]">
                                                <div className="min-w-0 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[12px] font-bold text-black truncate">{device.device_name}</p>
                                                        {isThisDevice && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[8px] font-bold uppercase tracking-wider">This Device</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-black/30 font-medium mt-0.5">Last used: {new Date(device.last_used_at).toLocaleDateString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Revoke access for ${device.device_name}?`)) {
                                                            revokeDevice(device.device_id)
                                                        }
                                                    }}
                                                    className="p-2 rounded-xl hover:bg-red-50 text-black/20 hover:text-red-500 transition-all"
                                                >
                                                    <CloseIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                    {authorizedDevices.length === 0 && !fetchingDevices && (
                                        <div className="text-center py-6 bg-black/[0.01] rounded-2xl border border-dashed border-black/[0.06]">
                                            <p className="text-[11px] text-black/30 font-medium italic">No devices authorized yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-black/[0.04]" />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-[14px] font-bold text-black">System Lockdown</p>
                                    <p className="text-[11px] text-black/35 font-medium pr-4">Clear local session data and force a full system relock. Use if you're experiencing sync issues.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm('This will log you out of KarrOS on this device. Your PIN will be required to get back in. Continue?')) {
                                            localStorage.removeItem('karrOS_unlocked')
                                            localStorage.removeItem('karrOS_shield_id')
                                            localStorage.removeItem('karrOS_biometric_id')
                                            window.location.reload()
                                        }
                                    }}
                                    className="whitespace-nowrap px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-600 hover:text-white transition-all shadow-sm shadow-red-500/5 active:scale-95 border border-red-100"
                                >
                                    Log Out & Reset Session
                                </button>
                            </div>
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
