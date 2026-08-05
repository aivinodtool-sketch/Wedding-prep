'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Category = {
  id: string
  wedding_id: string
  name: string
  parent_id: string | null
  type: string
  sort_order: number
  created_at?: string
  children?: Category[]
}

const DEFAULT_CATEGORY_TREES = [
  {
    name: 'Venue & Catering',
    subs: ['Booking & Deposit', 'Food Menu & Tasting', 'Drinks & Bar', 'Staff & Servers'],
  },
  {
    name: 'Bridal & Groom',
    subs: ['Makeup & Hair', 'Bridal Outfit', 'Groom Outfit', 'Jewelry & Accessories', 'Mehendi / Henna'],
  },
  {
    name: 'Photography & Video',
    subs: ['Pre-wedding Shoot', 'Wedding Day Photography', 'Cinematography / Video', 'Photo Album'],
  },
  {
    name: 'Decor & Theme',
    subs: ['Stage & Backdrop', 'Floral Arrangements', 'Lighting & Sound', 'Table Settings & Centerpieces'],
  },
  {
    name: 'Music & Entertainment',
    subs: ['DJ & Sound System', 'Live Band & Singers', 'Dancers & Choreography'],
  },
  {
    name: 'Shopping & Favors',
    subs: ['Return Gifts & Favors', 'Invitation Cards', 'Pooja Items', 'Packing & Hampers'],
  },
  {
    name: 'Logistics & Guest Care',
    subs: ['Hotel & Accommodations', 'Transportation & Cars', 'Welcome Kit / Bags'],
  },
  {
    name: 'Other',
    subs: ['Miscellaneous', 'Emergency Fund'],
  },
]

export async function getCategories(weddingId: string): Promise<Category[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    // If table doesn't exist or other schema errors, return hardcoded defaults
    if (error && (error.code === '42P01' || error.code === 'PGRST116')) {
      return DEFAULT_CATEGORY_TREES.map((t, i) => ({
        id: `default-p-${i}`,
        wedding_id: weddingId,
        name: t.name,
        parent_id: null,
        type: 'default',
        sort_order: i,
        children: t.subs.map((s, si) => ({
          id: `default-c-${i}-${si}`,
          wedding_id: weddingId,
          name: s,
          parent_id: `default-p-${i}`,
          type: 'default',
          sort_order: si,
        }))
      }))
    }

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    let rawCategories = data || []

    // If no categories exist yet in DB for this wedding, seed standard default categories and subcategories
    if (rawCategories.length === 0) {
      for (let i = 0; i < DEFAULT_CATEGORY_TREES.length; i++) {
        const item = DEFAULT_CATEGORY_TREES[i]
        const { data: parentData, error: parentError } = await supabase
          .from('categories')
          .insert({
            wedding_id: weddingId,
            name: item.name,
            parent_id: null,
            sort_order: i,
          })
          .select()
          .single()

        if (!parentError && parentData) {
          const parentId = parentData.id
          const subRows = item.subs.map((subName, subIdx) => ({
            wedding_id: weddingId,
            name: subName,
            parent_id: parentId,
            sort_order: subIdx,
          }))
          await supabase.from('categories').insert(subRows)
        }
      }

      // Re-fetch created categories
      const { data: refetched } = await supabase
        .from('categories')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('sort_order', { ascending: true })

      rawCategories = refetched || []
    }

    // Build parent-child category tree
    const parentCategories: Category[] = rawCategories
      .filter((c) => !c.parent_id)
      .map((parent) => ({
        ...parent,
        children: rawCategories.filter((child) => child.parent_id === parent.id),
      }))

    return parentCategories
  } catch (error) {
    console.error('Error in getCategories:', error)
    return []
  }
}

export async function createCategory(
  weddingId: string,
  name: string,
  parentId?: string | null
): Promise<Category | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('categories')
      .insert({
        wedding_id: weddingId,
        name: name.trim(),
        parent_id: parentId || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      throw new Error(error.message || 'Could not create category')
    }

    revalidatePath('/dashboard')
    revalidatePath('/tasks')
    revalidatePath('/shopping')
    revalidatePath('/vendors')
    return data as Category
  } catch (error: any) {
    console.error('Error in createCategory:', error)
    throw new Error(error.message || 'Failed to create category')
  }
}

export async function updateCategory(categoryId: string, name: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('categories')
      .update({ name: name.trim() })
      .eq('id', categoryId)

    if (error) {
      console.error('Error updating category:', error)
      throw new Error(error.message || 'Could not update category')
    }

    revalidatePath('/dashboard')
    revalidatePath('/tasks')
    revalidatePath('/shopping')
    revalidatePath('/vendors')
  } catch (error: any) {
    console.error('Error in updateCategory:', error)
    throw new Error(error.message || 'Failed to update category')
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting category:', error)
      throw new Error(error.message || 'Could not delete category')
    }

    revalidatePath('/dashboard')
    revalidatePath('/tasks')
    revalidatePath('/shopping')
    revalidatePath('/vendors')
  } catch (error: any) {
    console.error('Error in deleteCategory:', error)
    throw new Error(error.message || 'Failed to delete category')
  }
}
