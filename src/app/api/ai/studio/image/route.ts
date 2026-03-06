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
        if (!candidates || candidates.length === 0) {
            throw new Error('No image generated')
        }

        // Gemini returns the image as inlineData (base64) for generated images usually, 
        // or a URL if uploaded. For Imagen 3, we often get the image data back.
        // Let's check for the image part.
        const part = candidates[0].content.parts[0]
        if (part.inlineData) {
            const base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
            return NextResponse.json({ url: base64Image })
        }

        throw new Error('Unexpected response format from Gemini')
    } catch (err: any) {
        console.error('[Studio Imagen Gen Error]', err)
        return NextResponse.json({ error: err.message || 'AI service error' }, { status: 500 })
    }
}
