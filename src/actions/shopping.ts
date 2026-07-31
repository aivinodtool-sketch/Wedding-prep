'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ShoppingItem = {
  id: string
  wedding_id: string
  name: string
  category: string
  quantity: number
  estimated_cost: number
  actual_cost: number
  is_purchased: boolean
  notes: string | null
  created_at?: string
}

export async function getShoppingItems(weddingId: string): Promise<ShoppingItem[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching shopping items:', error)
      return []
    }

    return (data || []).map((item) => ({
      ...item,
      estimated_cost: Number(item.estimated_cost || 0),
      actual_cost: Number(item.actual_cost || 0),
    })) as ShoppingItem[]
  } catch (error) {
    console.error('Error in getShoppingItems:', error)
    return []
  }
}

export async function createShoppingItem(formData: FormData) {
  const wedding_id = formData.get('wedding_id') as string
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const estimated_cost = parseFloat(formData.get('estimated_cost') as string || '0')
  const actual_cost = parseFloat(formData.get('actual_cost') as string || '0')

  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_items')
    .insert({
      wedding_id,
      name,
      category,
      estimated_cost,
      actual_cost,
      is_purchased: false,
    })

  if (error) {
    console.error('Error creating shopping item:', error)
    throw new Error(error.message || 'Could not create shopping item')
  }

  revalidatePath('/shopping')
}

export async function toggleItemPurchased(itemId: string, isPurchased: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_items')
    .update({ is_purchased: isPurchased })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating item purchase status:', error)
    throw new Error(error.message || 'Could not update item')
  }

  revalidatePath('/shopping')
}

export async function deleteShoppingItem(itemId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error deleting shopping item:', error)
    throw new Error(error.message || 'Could not delete item')
  }

  revalidatePath('/shopping')
}
