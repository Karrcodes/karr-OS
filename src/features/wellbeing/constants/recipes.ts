import type { Recipe } from '../types'

export const RECIPES: Recipe[] = [
    {
        id: 'protein-oats',
        name: 'Pro-Oats (Bulk Edition)',
        type: 'breakfast',
        prepTime: '10 mins',
        calories: 550,
        protein: 45,
        fat: 12,
        carbs: 65,
        goal: 'bulk',
        ingredients: [
            { name: 'Oats', amount: '80g', calories: 300, protein: 10, fat: 5, carbs: 50 },
            { name: 'Whey Protein', amount: '1 scoop', calories: 120, protein: 25, fat: 2, carbs: 3 },
            { name: 'Peanut Butter', amount: '15g', calories: 90, protein: 4, fat: 5, carbs: 2 },
            { name: 'Berries', amount: '50g', calories: 40, protein: 1, fat: 0, carbs: 10 }
        ],
        instructions: [
            'Microwave oats with water or milk for 2 minutes.',
            'Stir in protein powder (add more water if too thick).',
            'Top with peanut butter and berries.'
        ]
    },
    {
        id: 'chicken-rice-broccoli',
        name: 'The Classic Meal Prep',
        type: 'lunch',
        prepTime: '25 mins',
        calories: 450,
        protein: 40,
        fat: 10,
        carbs: 50,
        goal: 'all',
        ingredients: [
            { name: 'Chicken Breast', amount: '150g', calories: 250, protein: 35, fat: 5, carbs: 0 },
            { name: 'Brown Rice', amount: '150g (cooked)', calories: 160, protein: 3, fat: 1, carbs: 35 },
            { name: 'Broccoli', amount: '100g', calories: 40, protein: 2, fat: 4, carbs: 15 }
        ],
        instructions: [
            'Season chicken with salt, pepper, and paprika.',
            'Pan-fry or bake chicken until internal temp is 75°C.',
            'Steam broccoli and serve with rice.'
        ]
    },
    {
        id: 'salmon-quinoa',
        name: 'Omega-3 Lean Bowl',
        type: 'dinner',
        prepTime: '20 mins',
        calories: 520,
        protein: 35,
        fat: 22,
        carbs: 45,
        goal: 'cut',
        ingredients: [
            { name: 'Salmon Fillet', amount: '120g', calories: 240, protein: 25, fat: 15, carbs: 0 },
            { name: 'Quinoa', amount: '120g (cooked)', calories: 140, protein: 5, fat: 2, carbs: 25 },
            { name: 'Asparagus', amount: '100g', calories: 40, protein: 2, fat: 5, carbs: 20 }
        ],
        instructions: [
            'Pan-sear salmon skin-side down for 4 mins, then flip for 2 mins.',
            'Serve with quinoa and sautéed asparagus.'
        ]
    }
]
