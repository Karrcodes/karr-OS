export const MOCK_FINANCE = {
    pockets: [
        { id: 'd-p-1', name: 'Bills', target_budget: 1200, balance: 1245.50, type: 'general', sort_order: 1 },
        { id: 'd-p-2', name: 'Groceries', target_budget: 400, balance: 350.20, type: 'general', sort_order: 2 },
        { id: 'd-p-3', name: 'Transport', target_budget: 150, balance: 142.00, type: 'general', sort_order: 3 },
        { id: 'd-p-4', name: 'Personal', target_budget: 500, balance: 712.30, type: 'general', sort_order: 4 },
        { id: 'd-p-5', name: 'Emergency Fund', target_budget: 5000, balance: 2500.00, type: 'savings', sort_order: 5 },
    ],
    obligations: [
        { id: 'd-o-1', name: 'Rent', amount: 850, frequency: 'monthly', due_day: 1 },
        { id: 'd-o-2', name: 'Council Tax', amount: 145, frequency: 'monthly', due_day: 15 },
        { id: 'd-o-3', name: 'Energy', amount: 110, frequency: 'monthly', due_day: 20 },
        { id: 'd-o-4', name: 'Internet', amount: 35, frequency: 'monthly', due_day: 12 },
        { id: 'd-o-5', name: 'Gym', amount: 45, frequency: 'monthly', due_day: 5 },
    ],
    income: {
        raw: 3750.00, // Monthly gross
        net: 2845.60, // Monthly net approx
        label: 'Work Portal Payment'
    }
}

export const MOCK_TASKS = {
    todo: [
        { id: 'd-t-1', title: 'Complete Project Alpha documentation', priority: 'high', is_completed: false, due_date: new Date().toISOString() },
        { id: 'd-t-2', title: 'Schedule car service', priority: 'mid', is_completed: false },
        { id: 'd-t-3', title: 'Buy anniversary gift', priority: 'high', is_completed: true },
    ],
    grocery: [
        { id: 'd-g-1', title: 'Milk', priority: 'low', is_completed: false },
        { id: 'd-g-2', title: 'Eggs', priority: 'low', is_completed: false },
        { id: 'd-g-3', title: 'Bread', priority: 'low', is_completed: true },
        { id: 'd-g-4', title: 'Coffee Beans', priority: 'mid', is_completed: false },
    ],
    reminder: [
        { id: 'd-r-1', title: 'Call Landlord regarding tap leak', priority: 'high', is_completed: false },
        { id: 'd-r-2', title: 'Renew insurance', priority: 'super', is_completed: false, due_date: new Date(Date.now() + 86400000 * 3).toISOString() },
    ]
}

export const MOCK_ROTA = {
    anchor: '2026-02-23', // A Monday
    pattern: [3, 3] // 3 on, 3 off
}
