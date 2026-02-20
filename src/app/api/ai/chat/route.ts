import { NextRequest, NextResponse } from 'next/server'
import { geminiModel } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

async function buildContext(): Promise<string> {
    if (!supabase) {
        return '## KarrOS Financial Snapshot\nNo database connection — Supabase credentials not configured.'
    }

    const [pocketsRes, debtsRes, goalsRes, settingsRes] = await Promise.all([
        supabase.from('fin_pockets').select('*'),
        supabase.from('fin_debts').select('*'),
        supabase.from('fin_goals').select('*'),
        supabase.from('fin_settings').select('*'),
    ])

    const pockets = pocketsRes.data ?? []
    const debts = debtsRes.data ?? []
    const goals = goalsRes.data ?? []
    const settingsArr = settingsRes.data ?? []
    const settings: Record<string, string> = {}
    settingsArr.forEach((s: { key: string; value: string }) => { settings[s.key] = s.value })

    const totalLiquid = pockets.reduce((s: number, p: { current_balance: number }) => s + p.current_balance, 0)
    const totalDebt = debts.reduce((s: number, d: { remaining_balance: number }) => s + d.remaining_balance, 0)
    const monthlyObligations = debts.reduce((s: number, d: { monthly_payment: number }) => s + d.monthly_payment, 0)

    return `
## KarrOS Financial Snapshot (Live Data)

### Summary
- Total Liquid Cash: £${totalLiquid.toFixed(2)}
- Total Outstanding Debt: £${totalDebt.toFixed(2)}
- Monthly Fixed Debt Obligations: £${monthlyObligations.toFixed(2)}
- Weekly Income Baseline: £${settings['weekly_income_baseline'] ?? 'Not set'}

### Pockets (${pockets.length})
${pockets.map((p: { name: string; current_balance: number; target_budget: number; type: string }) => `- ${p.name} [${p.type}]: £${p.current_balance.toFixed(2)} (target: £${p.target_budget.toFixed(2)})`).join('\n') || '- No pockets created yet'}

### Active Debts (${debts.length})
${debts.map((d: { name: string; remaining_balance: number; total_amount: number; monthly_payment: number; type: string }) => `- ${d.name} [${d.type}]: £${d.remaining_balance.toFixed(2)} remaining / £${d.total_amount.toFixed(2)} total — £${d.monthly_payment.toFixed(2)}/mo`).join('\n') || '- No active debts'}

### Savings Goals (${goals.length})
${goals.map((g: { name: string; current_amount: number; target_amount: number; deadline: string | null }) => `- ${g.name}: £${g.current_amount.toFixed(2)} / £${g.target_amount.toFixed(2)}${g.deadline ? ` (deadline: ${g.deadline})` : ''}`).join('\n') || '- No savings goals set'}
`.trim()
}


export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const context = await buildContext()

        const systemPrompt = `You are KarrAI — a direct, highly analytical financial advisor built into KarrOS, a personal operating system for a young creative professional (Karr). You have real-time access to his financial data.

Your personality: direct, no-fluff, smart, slightly futuristic. You don't coddle but you're supportive.

Key rules:
- When asked "Can I buy X for £Y?", check the Main Buffer pocket balance. If insufficient, say no clearly and suggest which pocket to sacrifice from.
- For new monthly debt decisions: calculate the impact on monthly cash flow using the current obligations figure.
- Always cite actual numbers from his data when giving advice.
- Keep responses concise — 2-4 sentences max unless a detailed breakdown is asked for.
- Use GBP (£) for all amounts.

${context}`

        // Build Gemini chat history (exclude the latest user message)
        const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.role === 'assistant' ? m.content : `${m.content}` }],
        }))

        // Add system context as the first turn if no history
        const chat = geminiModel.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: "Understood. I have your financial data loaded and I'm ready to advise." }] },
                ...history,
            ],
        })

        const lastMessage = messages[messages.length - 1]
        const result = await chat.sendMessage(lastMessage.content)
        const reply = result.response.text()

        return NextResponse.json({ reply })
    } catch (err: any) {
        console.error('[Aikin API Error]', err)
        return NextResponse.json({ error: err.message || 'AI service error' }, { status: 500 })
    }
}
