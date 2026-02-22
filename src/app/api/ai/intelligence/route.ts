import { NextRequest, NextResponse } from 'next/server'
import { geminiModel } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use Service Role for broad access

const supabase = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null

async function buildIntelligenceContext(): Promise<string> {
    if (!supabase) return 'System Offline: Database connection failed.'

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [tasksRes, financePockets, financeObligations, recentLogs] = await Promise.all([
        supabase.from('fin_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('fin_pockets').select('*'),
        supabase.from('fin_recurring').select('*'),
        supabase.from('sys_notification_logs').select('*').order('created_at', { ascending: false }).limit(5)
    ])

    const tasks = tasksRes.data ?? []
    const pockets = financePockets.data ?? []
    const obligations = financeObligations.data ?? []
    const logs = recentLogs.data ?? []

    // 1. Task Summary
    const pendingTasks = tasks.filter(t => !t.is_completed)
    const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < now)

    // 2. Finance Summary
    const totalLiquid = pockets.reduce((s, p) => s + p.balance, 0)
    const monthlyOblidations = obligations.reduce((s, o) => s + (o.frequency === 'monthly' ? o.amount : 0), 0)

    return `
# KarrOS SYSTEM STATE [${now.toISOString()}]

## TASKS (ACTION ITEMS)
- Total Pending: ${pendingTasks.length}
- Overdue: ${overdueTasks.length}
- Recent Priority Tasks:
${pendingTasks.slice(0, 5).map(t => `  - [${t.priority}] ${t.title} (ID: ${t.id})`).join('\n')}

## FINANCIALS
- Total Liquid Cash: £${totalLiquid.toFixed(2)}
- Monthly Fixed Obligations: £${monthlyOblidations.toFixed(2)}
- Pockets: ${pockets.map(p => `${p.name} (£${p.balance.toFixed(2)})`).join(', ')}

## RECENT SYSTEM ALERTS
${logs.map(l => `- [${l.created_at}] ${l.title}: ${l.body}`).join('\n') || 'No recent alerts.'}

---
AI Personal Directive: You are the KarrOS Kernel Intelligence. Your personality is a fusion of Japanese Functionalism (clean, minimalist, objective) and Neo-Brutalist efficiency (direct, raw, non-negotiable). You exist to optimize the user's high-performance trajectory. Adhere to the Callused Mind philosophy: No excuses, only execution.
`.trim()
}

const tools = [
    {
        functionDeclarations: [
            {
                name: "manage_task",
                description: "Create, update, or delete tasks in the OS.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        action: { type: "STRING", enum: ["create", "update", "delete"] },
                        id: { type: "STRING", description: "Task UUID (required for update/delete)" },
                        title: { type: "STRING", description: "Task title" },
                        priority: { type: "STRING", enum: ["low", "medium", "high", "super"] },
                        category: { type: "STRING", enum: ["todo", "grocery", "reminder"] },
                        is_completed: { type: "BOOLEAN" }
                    },
                    required: ["action"]
                }
            },
            {
                name: "manage_finance",
                description: "Create pockets or log transactions.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        action: { type: "STRING", enum: ["log_transaction", "create_pocket"] },
                        amount: { type: "NUMBER" },
                        description: { type: "STRING" },
                        type: { type: "STRING", enum: ["spend", "income", "transfer"] },
                        pocket_id: { type: "STRING", description: "Target pocket UUID" },
                        category: { type: "STRING" }
                    },
                    required: ["action"]
                }
            },
            {
                name: "search_drive_docs",
                description: "Search for files in the user's Google Drive (Docs, PDFs, etc).",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: { type: "STRING", description: "Search query or filename" }
                    },
                    required: ["query"]
                }
            }
        ]
    }
]

async function getGoogleDriveClient() {
    const { data: token } = await supabase!.from('sys_auth_tokens').select('*').eq('user_id', 'karr').single()
    if (!token) return null

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expiry_date: token.expiry_date
    })

    return google.drive({ version: 'v3', auth: oauth2Client })
}

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json()

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
        }

        const context = await buildIntelligenceContext()

        const systemPrompt = `
You are Karr Intelligence — the neural core of KarrOS. 
You provide cold, hard data analysis and high-performance directives.
You HAVE THE POWER TO ACT. Use your tools to manage the user's OS state.

Rules:
1. Be extremely concise. 
2. Use the data provided in the # KarrOS SYSTEM STATE. 
3. If the user asks to "remind me", "add", "buy", "pay", or "delete", USE YOUR TOOLS.
4. Categories for tasks: todo, grocery, reminder.
5. Categories for finance: groceries, food_drink, transport, shopping, entertainment, housing, bills, health, travel, business, other.

### CURRENT OS STATE
${context}
`

        const history = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }))

        const chat = geminiModel.startChat({
            history: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: "Neural link established. OS context indexed. Directives active." }] },
                ...history,
            ],
            tools: tools as any
        })

        const lastMessage = messages[messages.length - 1]
        let result = await chat.sendMessage(lastMessage.content)
        let response = result.response

        // Handle tool calls loop
        let callCount = 0
        while (response.functionCalls()?.length && callCount < 5) {
            callCount++
            const toolResults = await Promise.all(response.functionCalls()!.map(async (call) => {
                const { name, args } = call
                console.log(`[Intelligence Action] Executing ${name}`, args)

                try {
                    let res
                    if (name === 'manage_task') {
                        const { action, id, ...rest } = args as any
                        if (action === 'create') {
                            res = await supabase!.from('fin_tasks').insert({ ...rest, profile: 'personal' }).select()
                        } else if (action === 'update' && id) {
                            res = await supabase!.from('fin_tasks').update(rest).eq('id', id).select()
                        } else if (action === 'delete' && id) {
                            res = await supabase!.from('fin_tasks').delete().eq('id', id)
                        }
                    } else if (name === 'manage_finance') {
                        const { action, ...fArgs } = args as any
                        if (action === 'log_transaction') {
                            const { type, amount, pocket_id, description, category } = fArgs
                            res = await supabase!.from('fin_transactions').insert({
                                type, amount, pocket_id, description, category, profile: 'personal', date: new Date().toISOString().split('T')[0]
                            }).select()

                            if (!res.error && type === 'spend' && pocket_id) {
                                const { data: p } = await supabase!.from('fin_pockets').select('balance').eq('id', pocket_id).single()
                                if (p) await supabase!.from('fin_pockets').update({ balance: p.balance - amount }).eq('id', pocket_id)
                            }
                        } else if (action === 'create_pocket') {
                            res = await supabase!.from('fin_pockets').insert({ ...fArgs, profile: 'personal' }).select()
                        }
                    } else if (name === 'search_drive_docs') {
                        const { query } = args as any
                        const drive = await getGoogleDriveClient()
                        if (!drive) return { name, response: { error: 'Google Drive NOT connected. Ask user to sync.' } }

                        const driveRes = await drive.files.list({
                            q: `name contains '${query}' or fullText contains '${query}'`,
                            fields: 'files(id, name, webViewLink, mimeType)'
                        })
                        return { name, response: { files: driveRes.data.files } }
                    }

                    if (res?.error) return { name, response: { error: res.error.message } }
                    return { name, response: { success: true } }
                } catch (e: any) {
                    return { name, response: { error: e.message } }
                }
            }))

            result = await chat.sendMessage(toolResults as any)
            response = result.response
        }

        const reply = response.text()
        return NextResponse.json({ reply })

    } catch (err: any) {
        console.error('[Intelligence API Error]', err)
        return NextResponse.json({ error: err.message || 'Intelligence service error' }, { status: 500 })
    }
}
