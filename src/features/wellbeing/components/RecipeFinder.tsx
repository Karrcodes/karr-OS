import * as React from 'react'
import { useState } from 'react'
import { RECIPES } from '../constants/recipes'
import { useWellbeing } from '../contexts/WellbeingContext'
import type { Recipe } from '../types'
import { Search, Plus, Info, Clock, Flame, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RecipeFinder() {
    const { logMeal } = useWellbeing()
    const [search, setSearch] = useState('')
    const [selectedType, setSelectedType] = useState<string | 'all'>('all')
    const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)

    const filteredRecipes = RECIPES.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(search.toLowerCase())
        const matchesType = selectedType === 'all' || recipe.type === selectedType
        return matchesSearch && matchesType
    })

    const handleAddMeal = (recipe: Recipe) => {
        logMeal({
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: recipe.type,
            name: recipe.name,
            calories: recipe.calories,
            protein: recipe.protein,
            fat: recipe.fat,
            carbs: recipe.carbs,
            isRecipe: true,
            recipeId: recipe.id
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
                    <input
                        type="text"
                        placeholder="Search recipes (e.g. Pro-Oats)..."
                        className="w-full bg-white border border-black/5 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all",
                                selectedType === type
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-black/60 border-black/5 hover:border-black/20"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredRecipes.map((recipe) => (
                    <div
                        key={recipe.id}
                        className="bg-white border border-black/5 rounded-[32px] overflow-hidden transition-all hover:shadow-md"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-black/5 rounded-full text-[10px] font-black uppercase tracking-widest text-black/40">
                                            {recipe.type}
                                        </span>
                                        {recipe.goal && (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                recipe.goal === 'bulk' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                            )}>
                                                {recipe.goal}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-xl font-bold tracking-tight">{recipe.name}</h4>
                                </div>
                                <button
                                    onClick={() => handleAddMeal(recipe)}
                                    className="p-3 bg-black text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Cals</p>
                                    <p className="text-lg font-bold">{recipe.calories}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Prot</p>
                                    <p className="text-lg font-bold text-rose-500">{recipe.protein}g</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Fat</p>
                                    <p className="text-lg font-bold text-amber-500">{recipe.fat}g</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Carb</p>
                                    <p className="text-lg font-bold text-emerald-500">{recipe.carbs}g</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-bold text-black/40 mb-4">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {recipe.prepTime}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Info className="h-3.5 w-3.5" />
                                    {recipe.ingredients.length} Ingredients
                                </span>
                                <button
                                    onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
                                    className="ml-auto text-black flex items-center gap-1 hover:underline"
                                >
                                    {expandedRecipe === recipe.id ? 'Close details' : 'View details'}
                                    {expandedRecipe === recipe.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                            </div>

                            {expandedRecipe === recipe.id && (
                                <div className="mt-6 pt-6 border-t border-black/5 space-y-6">
                                    <div>
                                        <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-3">Ingredients</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {recipe.ingredients.map((ing, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-black/[0.02] p-3 rounded-xl">
                                                    <span className="text-sm font-medium">{ing.name} <span className="text-black/40">({ing.amount})</span></span>
                                                    <span className="text-[10px] font-black text-black/30">{ing.calories} kcal</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-3">Instructions</p>
                                        <div className="space-y-3">
                                            {recipe.instructions.map((step, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-black text-white text-[10px] font-black flex items-center justify-center rounded-lg">
                                                        {idx + 1}
                                                    </span>
                                                    <p className="text-sm text-black/70 leading-relaxed">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
