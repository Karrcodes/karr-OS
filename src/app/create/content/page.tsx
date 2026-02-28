'use client'

import ContentKanban from '@/features/studio/components/ContentKanban'

export default function ContentPage() {
    return (
        <main className="pb-24 pt-4 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <ContentKanban />
            </div>
        </main>
    )
}
