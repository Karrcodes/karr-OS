import { StudioProvider } from '@/features/studio/context/StudioContext'
import { KarrFooter } from '@/components/KarrFooter'

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return (
        <StudioProvider>
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-outfit">
                <div className="flex-1">
                    {children}
                </div>
                <KarrFooter />
            </div>
        </StudioProvider>
    )
}
