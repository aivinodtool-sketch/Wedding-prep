'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GuestStatus = 'invited' | 'attending' | 'declined' | 'not_invited'

export type Guest = {
  id: string
  wedding_id: string
  name: string
  family_name: string | null
  phone: string | null
  status: GuestStatus
  food_preference: string | null
  table_number: number | null
  gift_received: string | null
  notes: string | null
}

export async function getGuests(weddingId: string): Promise<Guest[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching guests:', error)
      return []
    }

    return (data || []) as Guest[]
  } catch (error) {
    console.error('Error in getGuests:', error)
    return []
  }
}

export async function createGuest(formData: FormData) {
  const wedding_id = formData.get('wedding_id') as string
  const name = formData.get('name') as string
  const family_name = (formData.get('family_name') as string) || null
  const phone = (formData.get('phone') as string) || null
  const status = (formData.get('status') as GuestStatus) || 'not_invited'
  const food_preference = (formData.get('food_preference') as string) || null
  const table_number_val = formData.get('table_number')
  const table_number = table_number_val ? parseInt(table_number_val as string, 10) : null
  const gift_received = (formData.get('gift_received') as string) || null
  const notes = (formData.get('notes') as string) || null

  const supabase = await createClient()

  const { error } = await supabase
    .from('guests')
    .insert({
      wedding_id,
      name,
      family_name,
      phone,
      status,
      food_preference,
      table_number,
      gift_received,
      notes,
    })

  if (error) {
    console.error('Error creating guest:', error)
    throw new Error(error.message || 'Could not create guest')
  }

  revalidatePath('/guests')
}

export async function updateGuest(guestId: string, formData: FormData) {
  const name = formData.get('name') as string
  const family_name = (formData.get('family_name') as string) || null
  const phone = (formData.get('phone') as string) || null
  const status = (formData.get('status') as GuestStatus) || 'not_invited'
  const food_preference = (formData.get('food_preference') as string) || null
  const table_number_val = formData.get('table_number')
  const table_number = table_number_val ? parseInt(table_number_val as string, 10) : null
  const gift_received = (formData.get('gift_received') as string) || null
  const notes = (formData.get('notes') as string) || null

  const supabase = await createClient()

  const { error } = await supabase
    .from('guests')
    .update({
      name,
      family_name,
      phone,
      status,
      food_preference,
      table_number,
      gift_received,
      notes,
    })
    .eq('id', guestId)

  if (error) {
    console.error('Error updating guest:', error)
    throw new Error(error.message || 'Could not update guest')
  }

  revalidatePath('/guests')
}

export async function bulkCreateGuests(
  weddingId: string,
  guestsList: Array<{
    name: string
    family_name?: string | null
    phone?: string | null
    status?: GuestStatus
    food_preference?: string | null
    table_number?: number | null
    notes?: string | null
  }>
) {
  const supabase = await createClient()

  const rows = guestsList.map((g) => ({
    wedding_id: weddingId,
    name: g.name,
    family_name: g.family_name || null,
    phone: g.phone || null,
    status: g.status || 'not_invited',
    food_preference: g.food_preference || null,
    table_number: g.table_number || null,
    notes: g.notes || null,
  }))

  const { error } = await supabase.from('guests').insert(rows)

  if (error) {
    console.error('Error bulk importing guests:', error)
    throw new Error(error.message || 'Could not import guests')
  }

  revalidatePath('/guests')
}

export async function deleteGuest(guestId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('guests')
    .delete()
    .eq('id', guestId)

  if (error) {
    console.error('Error deleting guest:', error)
    throw new Error(error.message || 'Could not delete guest')
  }

  revalidatePath('/guests')
}

