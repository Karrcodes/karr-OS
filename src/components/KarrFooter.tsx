import { cn } from '@/lib/utils'

export function KarrFooter({ dark }: { dark?: boolean }) {
    return (
        <div className="pt-12 pb-8 text-center select-none w-full mt-auto">
            <p className={cn(
                "text-[11px] font-bold uppercase tracking-widest",
                dark ? "text-white/10" : "text-black/20"
            )}>KarrOS</p>
            <p className={cn(
                "text-[10px] mt-1",
                dark ? "text-white/5" : "text-black/15"
            )}>v1.2.0 • Studio Karrtesian</p>
        </div>
    )
}

