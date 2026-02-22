export const MOCK_FINANCE = {
    pockets: [
        { id: 'd-p-1', name: 'Living & Bills', target_budget: 1800, balance: 1850.50, type: 'general', sort_order: 1 },
        { id: 'd-p-2', name: 'Specialty Coffee', target_budget: 80, balance: 42.20, type: 'general', sort_order: 2 },
        { id: 'd-p-3', name: 'Commute (TfL)', target_budget: 180, balance: 122.00, type: 'general', sort_order: 3 },
        { id: 'd-p-4', name: 'Dining & Social', target_budget: 400, balance: 212.30, type: 'general', sort_order: 4 },
        { id: 'd-p-5', name: 'Deposit Savings', target_budget: 25000, balance: 12500.00, type: 'savings', sort_order: 5 },
        { id: 'd-p-6', name: 'Investment (Index)', target_budget: 5000, balance: 4200.00, type: 'savings', sort_order: 6 },
    ],
    obligations: [
        { id: 'd-o-1', name: 'Clapham Apartment Rent', amount: 1450, frequency: 'monthly', due_day: 1 },
        { id: 'd-o-2', name: 'Council Tax (Lambeth)', amount: 165, frequency: 'monthly', due_day: 15 },
        { id: 'd-o-3', name: 'Octopus Energy', amount: 140, frequency: 'monthly', due_day: 20 },
        { id: 'd-o-4', name: 'Hyperoptic Fiber', amount: 45, frequency: 'monthly', due_day: 12 },
        { id: 'd-o-5', name: 'Equinox Gym Membership', amount: 220, frequency: 'monthly', due_day: 5 },
        { id: 'd-o-6', name: 'Student Loan (Plan 2)', amount: 240, frequency: 'monthly', due_day: 28, payments_left: 108 },
        { id: 'd-o-7', name: 'Car Finance (Audi A3)', amount: 325, frequency: 'monthly', due_day: 25, payments_left: 24 },
        { id: 'd-o-8', name: 'Klarna: Studio Gear', amount: 85, frequency: 'monthly', due_day: 14, payments_left: 4 },
        { id: 'd-o-9', name: 'Netflix Premium', amount: 17.99, frequency: 'monthly', due_day: 10 },
        { id: 'd-o-10', name: 'Spotify Family', amount: 19.99, frequency: 'monthly', due_day: 18 },
        { id: 'd-o-11', name: 'Adobe Creative Cloud', amount: 52.00, frequency: 'monthly', due_day: 22 },
    ],
    income: {
        raw: 3750.00, // Monthly gross (£45k)
        net: 2912.40, // Monthly net approx
        label: 'Lumina Digital Salary',
        employer: 'Lumina Digital'
    },
    transactions: [
        { id: 'd-tx-1', description: 'Monmouth Coffee Company', amount: 4.80, category: 'food_drink', type: 'spend', date: '2026-02-18' },
        { id: 'd-tx-2', description: 'TfL Travel Charge', amount: 8.40, category: 'transport', type: 'spend', date: '2026-02-18' },
        { id: 'd-tx-3', description: 'Waitrose Clapham', amount: 62.15, category: 'groceries', type: 'spend', date: '2026-02-17' },
        { id: 'd-tx-4', description: 'Netflix Subscription', amount: 17.99, category: 'entertainment', type: 'spend', date: '2026-02-10' },
        { id: 'd-tx-5', description: 'Lumina Digital Salary', amount: 2912.40, category: 'income', type: 'income', date: '2026-01-31' },
        { id: 'd-tx-6', description: 'Dishoom Shoreditch', amount: 78.40, category: 'food_drink', type: 'spend', date: '2026-02-14' },
        { id: 'd-tx-7', description: 'PureGym Clapham', amount: 29.99, category: 'health', type: 'spend', date: '2026-02-01' },
        { id: 'd-tx-8', description: 'Apple iCloud', amount: 8.99, category: 'other', type: 'spend', date: '2026-02-05' },
        { id: 'd-tx-9', description: 'Amazon.co.uk', amount: 34.50, category: 'shopping', type: 'spend', date: '2026-02-12' },
        { id: 'd-tx-10', description: 'TfL Travel Charge', amount: 7.20, category: 'transport', type: 'spend', date: '2026-02-15' },
        { id: 'd-tx-11', description: 'Pact Coffee Subscription', amount: 18.00, category: 'food_drink', type: 'spend', date: '2026-02-16' },
        { id: 'd-tx-12', description: 'Uniqlo Oxford St', amount: 45.00, category: 'shopping', type: 'spend', date: '2026-02-08' },
        { id: 'd-tx-13', description: 'Starbucks (Station)', amount: 4.20, category: 'food_drink', type: 'spend', date: '2026-02-19' },
        { id: 'd-tx-14', description: 'Uber Trip', amount: 15.60, category: 'transport', type: 'spend', date: '2026-02-14' },
        { id: 'd-tx-15', description: 'Boots Pharmacy', amount: 12.30, category: 'health', type: 'spend', date: '2026-02-10' },
        { id: 'd-tx-16', description: 'TfL Travel Charge', amount: 8.40, category: 'transport', type: 'spend', date: '2026-02-19' },
    ],
    goals: [
        { id: 'd-g-1', name: 'Apartment Deposit', target_amount: 50000, current_amount: 12500, deadline: '2027-12-31', category: 'housing' },
        { id: 'd-g-2', name: 'Creative Studio Upgrades', target_amount: 5000, current_amount: 1800, deadline: '2026-08-31', category: 'other' },
        { id: 'd-g-3', name: 'Tokyo Trip 2026', target_amount: 3500, current_amount: 1200, deadline: '2026-10-15', category: 'travel' },
    ]
}

export const MOCK_BUSINESS = {
    name: 'Karrtesian Media',
    pockets: [
        { id: 'd-bp-1', name: 'KM: Operational', target_budget: 2000, balance: 3450.20, type: 'general', sort_order: 1 },
        { id: 'd-bp-2', name: 'KM: Tax Reserve', target_budget: 10000, balance: 4120.00, type: 'savings', sort_order: 2 },
    ],
    transactions: [
        { id: 'd-btx-1', description: 'Client Payment: Vertex Inc', amount: 1250.00, category: 'income', type: 'income', date: '2026-02-10' },
        { id: 'd-btx-2', description: 'Client Payment: Aura Agency', amount: 800.00, category: 'income', type: 'income', date: '2026-02-05' },
        { id: 'd-btx-3', description: 'AWS Hosting Services', amount: 42.15, category: 'business', type: 'spend', date: '2026-02-01' },
        { id: 'd-btx-4', description: 'Figma Professional', amount: 12.00, category: 'business', type: 'spend', date: '2026-02-03' },
        { id: 'd-btx-5', description: 'Buffer Subscription', amount: 15.00, category: 'business', type: 'spend', date: '2026-02-05' },
        { id: 'd-btx-6', description: 'Envato Elements', amount: 28.00, category: 'business', type: 'spend', date: '2026-02-07' },
    ],
    obligations: [
        { id: 'd-bo-1', name: 'Co-working Hotdesk', amount: 250, frequency: 'monthly', due_day: 5 },
        { id: 'd-bo-2', name: 'Professional Insurance', amount: 35, frequency: 'monthly', due_day: 10 },
        { id: 'd-bo-3', name: 'MacBook Pro Finance', amount: 115, frequency: 'monthly', due_day: 15, payments_left: 14 },
    ]
}

export const MOCK_TASKS = {
    todo: [
        { id: 'd-t-1', title: 'Review Q1 Creative Strategy for Vertex', priority: 'high', is_completed: false, due_date: new Date().toISOString() },
        { id: 'd-t-2', title: 'Schedule Studio session for podcast recording', priority: 'mid', is_completed: false },
        { id: 'd-t-3', title: 'Send invoice to Aura Agency', priority: 'high', is_completed: true },
        { id: 'd-t-4', title: 'Research specialty coffee beans for office', priority: 'low', is_completed: false },
        { id: 'd-t-5', title: 'Update portfolio with latest photography work', priority: 'mid', is_completed: false },
        { id: 'd-t-6', title: 'Book dentist appointment', priority: 'low', is_completed: true },
        { id: 'd-t-7', title: 'Refactor Intelligence context builders', priority: 'super', is_completed: false },
    ],
    grocery: [
        { id: 'd-g-1', title: 'Oat Milk (Barista Edition)', amount: 'x2', priority: 'mid', is_completed: false },
        { id: 'd-g-2', title: 'Organic Avocados', amount: 'x4', priority: 'low', is_completed: false },
        { id: 'd-g-3', title: 'Specialty Coffee Beans (Ethiopian)', amount: 'x1', priority: 'high', is_completed: false },
        { id: 'd-g-4', title: 'Sourdough Bread', amount: 'x1', priority: 'low', is_completed: true },
        { id: 'd-g-5', title: 'Fresh Pasta', amount: 'x2', priority: 'mid', is_completed: false },
        { id: 'd-g-6', title: 'Sea Salt Dark Chocolate', amount: 'x1', priority: 'low', is_completed: false },
    ],
    reminder: [
        { id: 'd-r-1', title: 'Submit Self-Assessment Tax Return', priority: 'super', is_completed: false, due_date: '2026-01-31' },
        { id: 'd-r-2', title: 'Renew Apartment Insurance', priority: 'high', is_completed: false, due_date: new Date(Date.now() + 86400000 * 5).toISOString() },
        { id: 'd-r-3', title: 'Quarterly review with financial advisor', priority: 'mid', is_completed: false },
    ]
}

export const MOCK_VAULT = {
    clips: [
        { id: 'd-c-1', content: 'https://linear.app/studiokarrtesian/project/OS-CORE-Refactor', created_at: new Date().toISOString() },
        { id: 'd-c-2', content: 'API_KEY: sk-demo-8492039402934029340293402', created_at: new Date().toISOString() },
        { id: 'd-c-3', content: 'Inspiration: "The best way to predict the future is to invent it." - Alan Kay', created_at: new Date().toISOString() },
        { id: 'd-c-4', content: 'Client Meeting Notes: Lumina Digital wants highly conversational AI prompts.', created_at: new Date().toISOString() },
    ],
    secrets: [
        { id: 'd-s-1', service: 'Lumina Digital Portal', username: 'karr@karrtesian.com', password: 'demo-password-123', notes: 'Corporate access' },
        { id: 'd-s-2', service: 'Adobe Creative Cloud', username: 'karr@karrtesian.com', password: 'creative-vault-pass', notes: 'Business account' },
        { id: 'd-s-3', service: 'LinkedIn', username: 'karr@karrtesian.com', password: 'professional-network-2026', notes: 'Personal' },
        { id: 'd-s-4', service: 'Wealthfront', username: 'karr@karrtesian.com', password: 'money-growth-99', notes: 'Investment account' },
    ]
}

export const MOCK_SCHEDULE = {
    anchor: '2026-02-23', // A Monday
    type: 'work',
    daysPerWeek: 4, // Mon-Thu
    label: 'Lumina Digital Work'
}
