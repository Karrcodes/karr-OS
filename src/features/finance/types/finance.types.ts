export interface Pocket {
    id: string
    name: string
    target_budget: number
    current_balance: number
    type: 'general' | 'savings' | 'buffer'
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

export interface Transaction {
    id: string
    type: 'income' | 'expense' | 'transfer'
    amount: number
    from_pocket: string | null
    to_pocket: string | null
    description: string | null
    date: string
    created_at: string
}

export interface Goal {
    id: string
    name: string
    target_amount: number
    current_amount: number
    deadline: string | null
    created_at: string
}

export interface FinanceSetting {
    key: string
    value: string
    updated_at: string
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
