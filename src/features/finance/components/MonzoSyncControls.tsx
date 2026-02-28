import { RefreshCw, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePots } from '../hooks/usePots'

interface MonzoSyncControlsProps {
    className?: string
    showText?: boolean
}

export function MonzoSyncControls({ className, showText = true }: MonzoSyncControlsProps) {
    const { isSyncing, isMonzoConnected, syncMonzo } = usePots()

    const handleReconnect = () => {
        window.location.href = '/api/finance/monzo/auth'
    }

    if (!isMonzoConnected) {
        return (
            <button
                onClick={handleReconnect}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all font-bold text-[11px]",
                    className
                )}
            >
                <RefreshCw className="w-3.5 h-3.5" />
                {showText && "Connect Monzo"}
            </button>
        )
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <button
                onClick={() => syncMonzo()}
                disabled={isSyncing}
                className="flex items-center gap-2 px-3 py-2 bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 rounded-xl hover:bg-[#7c3aed]/20 transition-all font-bold text-[11px] min-w-[100px] justify-center"
            >
                <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                {showText && (isSyncing ? "Syncing..." : "Sync Monzo")}
            </button>
            <button
                onClick={handleReconnect}
                title="Reconnect Monzo (Change accounts/permissions)"
                className="p-2 bg-black/[0.03] text-black/40 hover:text-black/60 hover:bg-black/[0.06] border border-black/[0.06] rounded-xl transition-all"
            >
                <LinkIcon className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}
