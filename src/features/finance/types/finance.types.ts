export interface Pocket {
    id: string
    name: string
    target_budget: number
    current_balance: number
    balance: number // New dynamic cashflow balance
    sort_order: number
    type: 'general' | 'savings' | 'buffer'
    profile: 'personal' | 'business'
    created_at: string
}

export interface Debt {
    id: string
    name: string
    total_amount: number
    remaining_balance: number
    monthly_payment: number
    due_date_of_month: number | null
    type: 'Short-Term' | 'Long-Term'
    created_at: string
}

export interface Income {
    id: string
    amount: number
    source: string
    date: string
    profile: 'personal' | 'business'
    created_at: string
}

export interface Transaction {
    id: string
    amount: number
    type: 'spend' | 'income' | 'allocate' | 'transfer'
    description: string
    date: string
    pocket_id: string | null
    category: string | null
    emoji: string | null
    profile: 'personal' | 'business'
    provider?: 'manual' | 'gocardless' | 'enable_banking' | 'revolut_csv'
    provider_tx_id?: string | null
    created_at: string
}

export interface Goal {
    id: string
    name: string
    target_amount: number
    current_amount: number
    deadline: string | null
    profile: 'personal' | 'business'
    created_at: string
}

export interface RecurringObligation {
    id: string
    name: string
    amount: number
    frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'yearly'
    next_due_date: string // YYYY-MM-DD
    end_date: string | null // YYYY-MM-DD
    group_name: string | null
    category: string | null
    emoji: string | null
    description: string | null
    payments_left: number | null
    profile: 'personal' | 'business'
    created_at: string
}

export interface FinanceSetting {
    key: string
    value: string
    updated_at: string
}

export interface Payslip {
    id: string
    date: string
    employer: string | null
    gross_pay: number | null
    net_pay: number
    tax_paid: number | null
    pension_contributions: number | null
    student_loan: number | null
    profile: 'personal' | 'business'
    created_at: string
}

export interface FinanceSummary {
    totalLiquid: number
    totalDebt: number
    monthlyDebtObligations: number
    pockets: Pocket[]
    debts: Debt[]
    goals: Goal[]
    weeklyIncomeBaseline: number
}
