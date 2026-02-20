import { Loader2 } from 'lucide-react'

export function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="mb-4">
                <h2 className="text-[15px] font-bold text-black dark:text-white">{title}</h2>
                <p className="text-[12px] text-black/35 mt-0.5">{desc}</p>
            </div>
            <div className="rounded-xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-[#0a0a0a] p-4 shadow-sm">
                {children}
            </div>
        </div>
    )
}

export function Spinner() {
    return (
        <div className="flex items-center justify-center gap-2 text-black/30 py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[12px]">Loading…</span>
        </div>
    )
}
