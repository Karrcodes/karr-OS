import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json()

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 })
        }

        const prompt = `Given this text snippet: "${text.substring(0, 500)}". Extract exactly 1 or 2 highest-quality generic visual keywords representing it to find a relevant stock photo on a stock photography site. DO NOT include any punctuation, quotes, or conversational text. ONLY output the keywords separated by a comma. Example: 'nature,mountain' or 'urban,night' or 'minimalist,office'. Keep it broad enough to guarantee a search hit.`

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(prompt)
        const rawResponse = result.response.text().trim().toLowerCase()

        // Extract keywords more robustly
        let keywords = (rawResponse || "")
            .split(',')
            .map(k => k.replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-'))
            .filter(k => k.length > 0)
            .slice(0, 2)
            .join(',')

        if (!keywords) keywords = 'nature,minimalist'

        // Fetch the initial redirect from loremflickr to get a permanent URL
        const imageRes = await fetch(`https://loremflickr.com/1200/800/${keywords}?lock=${Math.floor(Math.random() * 1000)}`, {
            redirect: 'manual'
        })

        let finalUrl = `https://loremflickr.com/1200/800/${keywords}` // Basic fallback

        // Manual redirect handling
        if (imageRes.status >= 300 && imageRes.status < 400) {
            const location = imageRes.headers.get('location')
            if (location) {
                finalUrl = location.startsWith('http') ? location : `https://loremflickr.com${location}`
            }
        } else {
            // If not a redirect, maybe it's already the image or another status
            finalUrl = imageRes.url || finalUrl
        }

        return NextResponse.json({ url: finalUrl })
    } catch (err: any) {
        console.error('[Studio Find Image Error]', err)
        return NextResponse.json({ error: err.message || 'AI service error' }, { status: 500 })
    }
}
