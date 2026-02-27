export interface Category {
    id: string
    label: string
    emoji: string
}

export const FINANCE_CATEGORIES: Category[] = [
    { id: 'bills', label: 'Bills', emoji: '💡' },
    { id: 'charity', label: 'Charity', emoji: '🎗️' },
    { id: 'eating_out', label: 'Eating out', emoji: '🍴' },
    { id: 'entertainment', label: 'Entertainment', emoji: '🎭' },
    { id: 'expenses', label: 'Expenses', emoji: '📄' },
    { id: 'family', label: 'Family', emoji: '🏠' },
    { id: 'finances', label: 'Finances', emoji: '💰' },
    { id: 'general', label: 'General', emoji: '⚪' },
    { id: 'gifts', label: 'Gifts', emoji: '🎁' },
    { id: 'groceries', label: 'Groceries', emoji: '🛒' },
    { id: 'holidays', label: 'Holidays', emoji: '🏖️' },
    { id: 'income', label: 'Income', emoji: '💰' },
    { id: 'personal_care', label: 'Personal care', emoji: '❤️' },
    { id: 'savings', label: 'Savings', emoji: '🌱' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
    { id: 'transfers', label: 'Transfers', emoji: '🔄' },
    { id: 'transport', label: 'Transport', emoji: '🚌' },
    { id: 'other', label: 'Other', emoji: '💸' },
]

export function getCategoryById(id: string): Category {
    return FINANCE_CATEGORIES.find(c => c.id === id) || FINANCE_CATEGORIES[FINANCE_CATEGORIES.length - 1]
}
