'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Vendor = {
  id: string
  wedding_id: string
  name: string
  category: string
  subcategory?: string | null
  phone: string | null
  address: string | null
  advance_paid: number
  total_amount: number
  rating: number | null
  created_at?: string
}

export async function getVendors(weddingId: string): Promise<Vendor[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vendors:', error)
      return []
    }

    return (data || []).map((v) => {
      let category = v.category || 'General'
      let subcategory: string | null = null

      if (category.includes(' > ')) {
        const parts = category.split(' > ')
        category = parts[0]
        subcategory = parts[1]
      }

      return {
        ...v,
        category,
        subcategory,
        advance_paid: Number(v.advance_paid || 0),
        total_amount: Number(v.total_amount || 0),
      }
    }) as Vendor[]
  } catch (error) {
    console.error('Error in getVendors:', error)
    return []
  }
}

export async function createVendor(formData: FormData) {
  const wedding_id = formData.get('wedding_id') as string
  const name = formData.get('name') as string
  const category = (formData.get('category') as string) || 'General'
  const subcategory = (formData.get('subcategory') as string) || null
  const phone = (formData.get('phone') as string) || null
  const total_amount = parseFloat((formData.get('total_amount') as string) || '0')
  const advance_paid = parseFloat((formData.get('advance_paid') as string) || '0')

  const combinedCategory = subcategory ? `${category} > ${subcategory}` : category

  const supabase = await createClient()
  const { error } = await supabase
    .from('vendors')
    .insert({
      wedding_id,
      name,
      category: combinedCategory,
      phone: phone || null,
      total_amount,
      advance_paid,
    })

  if (error) {
    console.error('Error creating vendor:', error)
    throw new Error(error.message || 'Could not create vendor')
  }

  revalidatePath('/dashboard')
  revalidatePath('/vendors')
}

export async function deleteVendor(vendorId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', vendorId)

  if (error) {
    console.error('Error deleting vendor:', error)
    throw new Error(error.message || 'Could not delete vendor')
  }

  revalidatePath('/dashboard')
  revalidatePath('/vendors')
}
