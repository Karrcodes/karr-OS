export interface Category {
    id: string
    label: string
    emoji: string
}

export const FINANCE_CATEGORIES: Category[] = [
    { id: 'groceries', label: 'Groceries', emoji: '🛒' },
    { id: 'food_drink', label: 'Food & Drink', emoji: '🍔' },
    { id: 'transport', label: 'Transport', emoji: '🚇' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { id: 'entertainment', label: 'Entertainment', emoji: '🎉' },
    { id: 'housing', label: 'Housing', emoji: '🏠' },
    { id: 'bills', label: 'Bills & Utilities', emoji: '⚡' },
    { id: 'health', label: 'Health', emoji: '🏥' },
    { id: 'travel', label: 'Travel', emoji: '✈️' },
    { id: 'business', label: 'Business', emoji: '💼' },
    { id: 'income', label: 'Income', emoji: '💰' },
    { id: 'transfer', label: 'Transfer', emoji: '🔄' },
    { id: 'other', label: 'Other', emoji: '💸' },
]

export function getCategoryById(id: string): Category {
    return FINANCE_CATEGORIES.find(c => c.id === id) || FINANCE_CATEGORIES[FINANCE_CATEGORIES.length - 1]
}
