import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json()

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
        }

        // Use Gemini's Imagen 3 model for high-quality cinematic generation
        try {
            const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" })

            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [{
                        text: `Cinematic, highly detailed, professional photography of: ${prompt}. 4k resolution, artistic lighting, studio quality, centered composition.`
                    }]
                }]
            })

            const response = result.response
            const candidates = response.candidates
            if (candidates && candidates.length > 0) {
                const part = candidates[0].content.parts[0]
                if (part.inlineData) {
                    const base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                    return NextResponse.json({ url: base64Image })
                }
            }
            throw new Error('Gemini did not return an image part')
        } catch (geminiErr) {
            console.warn('Gemini Imagen 3 failed, falling back to Pollinations:', geminiErr)

            // Fallback to Pollinations AI
            const cleanPrompt = (prompt || "aesthetic artistic creation").substring(0, 150).replace(/[^a-zA-Z0-9\s]/g, '')
            const encodedPrompt = encodeURIComponent(cleanPrompt + " cinematic, high resolution, professional photography")
            const fallbackUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`

            return NextResponse.json({ url: fallbackUrl, warning: 'Falling back to Pollinations' })
        }
    } catch (err: any) {
        console.error('[Studio Imagen Gen Error]', err)
        return NextResponse.json({ error: err.message || 'AI service error' }, { status: 500 })
    }
}
