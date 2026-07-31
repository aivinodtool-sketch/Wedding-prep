'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type BudgetItem = {
  id: string
  wedding_id: string
  category: string
  allocated_amount: number
  spent_amount: number
  created_at?: string
}

export async function getBudgets(weddingId: string): Promise<BudgetItem[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching budgets:', error)
      return []
    }

    return (data || []).map((b) => ({
      ...b,
      allocated_amount: Number(b.allocated_amount || 0),
      spent_amount: Number(b.spent_amount || 0),
    })) as BudgetItem[]
  } catch (error) {
    console.error('Error in getBudgets:', error)
    return []
  }
}

export async function createBudget(formData: FormData) {
  const wedding_id = formData.get('wedding_id') as string
  const category = formData.get('category') as string
  const allocated_amount = parseFloat(formData.get('allocated_amount') as string || '0')
  const spent_amount = parseFloat(formData.get('spent_amount') as string || '0')

  const supabase = await createClient()
  const { error } = await supabase
    .from('budgets')
    .insert({
      wedding_id,
      category,
      allocated_amount,
      spent_amount,
    })

  if (error) {
    console.error('Error creating budget:', error)
    throw new Error(error.message || 'Could not create budget category')
  }

  revalidatePath('/budget')
}

export async function deleteBudget(budgetId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)

  if (error) {
    console.error('Error deleting budget:', error)
    throw new Error(error.message || 'Could not delete budget')
  }

  revalidatePath('/budget')
}
