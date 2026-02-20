import { NextRequest, NextResponse } from 'next/server'
import { geminiModel } from '@/lib/gemini'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as Blob | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const mimeType = file.type

        const prompt = `You are a financial data extractor. Analyze this payslip image and extract the following information strictly as a JSON object:
- employer: The name of the employer or company issuing the payslip.
- netPay: The final net pay or take-home pay amount as a number (do not include currency symbols, just the float value).
- date: The date of the payslip or payment date, formatted strictly as YYYY-MM-DD.

Return ONLY the JSON object, with no markdown formatting or other text.
Example format:
{
  "employer": "Tech Corp",
  "netPay": 2450.50,
  "date": "2023-10-25"
}`

        const imagePart = {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType
            }
        }

        const result = await geminiModel.generateContent([prompt, imagePart])
        const text = result.response.text()

        // Clean up potential markdown formatting from the response
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const parsed = JSON.parse(cleanedText)
            return NextResponse.json(parsed)
        } catch (e) {
            console.error('Failed to parse Gemini response:', cleanedText)
            return NextResponse.json({ error: 'Failed to parse payslip data' }, { status: 500 })
        }

    } catch (err) {
        console.error('[Payslip Parse Error]', err)
        return NextResponse.json({ error: 'AI processing failed' }, { status: 500 })
    }
}
