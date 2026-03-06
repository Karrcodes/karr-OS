import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        // Use Pollinations AI for quick, free image generation based on a prompt
        const cleanPrompt = (prompt || "aesthetic artistic creation").substring(0, 150).replace(/[^a-zA-Z0-9\s]/g, '')
        const encodedPrompt = encodeURIComponent(cleanPrompt + " cinematic, high resolution, professional photography")
        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`

        return NextResponse.json({ url: imageUrl })
    } catch (err: any) {
        console.error('[Studio Image Gen Error]', err)
        return NextResponse.json({ error: err.message || 'AI service error' }, { status: 500 })
    }
}
