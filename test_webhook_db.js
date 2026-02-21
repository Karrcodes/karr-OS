import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInsert() {
    console.log('Testing insert with ANON_KEY...')
    const { data, error } = await supabase
        .from('fin_transactions')
        .insert({
            amount: 0.65,
            description: 'Test Apple Purchase',
            date: new Date().toISOString(),
            type: 'spend',
            category: 'other',
            profile: 'personal',
            provider: 'apple_pay'
        })
        .select()

    if (error) {
        console.error('Insert failed:', error.message)
        console.error('Details:', error.details)
        console.error('Hint:', error.hint)
    } else {
        console.log('Insert succeeded!', data)
    }
}

testInsert()
