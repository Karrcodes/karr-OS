'use client'

import { useState, useEffect } from 'react'
import { Bell, RefreshCw, Trash2, ArrowLeft, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { KarrFooter } from '@/components/KarrFooter'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface NotificationLog {
    id: string
    title: string
    body: string
    url?: string
    created_at: string
}

export default function NotificationsLogPage() {
    const router = useRouter()
    const [logs, setLogs] = useState<NotificationLog[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('sys_notification_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)

        if (!error) {
            setLogs(data || [])
        }
        setLoading(false)
    }

    const clearLogs = async () => {
        if (!confirm('Clear all notification history?')) return
        await supabase.from('sys_notification_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000') // delete all
        setLogs([])
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    return (
        <div className="flex flex-col h-full bg-[#fafafa]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-white flex-shrink-0 z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-black/[0.03] flex items-center justify-center text-black hover:bg-black/[0.08] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-[22px] font-bold text-black tracking-tight">Notification History</h1>
                        <p className="text-[12px] text-black/40 mt-0.5">Logs of recent alerts sent to your devices</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {logs.length > 0 && (
                        <button
                            onClick={clearLogs}
                            className="text-[12px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                <div className="w-full max-w-2xl space-y-3">
                    {loading && logs.length === 0 ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 text-black/20 animate-spin" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-4">
                                <Bell className="w-6 h-6 text-black/20" />
                            </div>
                            <p className="text-[14px] font-bold text-black mt-2">No Notifications Yet</p>
                            <p className="text-[12px] text-black/40 mt-1">When the system sends an alert, it will appear here.</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-sm flex items-start gap-4 hover:border-black/[0.15] transition-colors">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                                    <Bell className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[14px] font-bold text-black truncate">{log.title}</h3>
                                    <p className="text-[13px] text-black/60 mt-0.5 whitespace-pre-wrap">{log.body}</p>

                                    <div className="flex items-center justify-between mt-3">
                                        <p className="text-[11px] font-medium text-black/35">
                                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                        </p>
                                        {log.url && log.url !== '/' && (
                                            <Link
                                                href={log.url}
                                                className="text-[11px] font-bold text-black/50 hover:text-black flex items-center gap-1 bg-black/5 hover:bg-black/10 px-2.5 py-1 rounded transition-colors"
                                            >
                                                Open Link
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-8">
                    <KarrFooter />
                </div>
            </div>
        </div>
    )
}

function Loader2(props: any) {
    return <RefreshCw {...props} />
}
