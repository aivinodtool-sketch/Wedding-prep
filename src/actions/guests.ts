'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GuestStatus = 'invited' | 'attending' | 'declined' | 'not_invited'

export type Guest = {
  id: string
  wedding_id: string
  name: string
  family_name: string | null
  status: GuestStatus
  group: string | null
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
  const family_name = formData.get('family_name') as string
  const status = (formData.get('status') as GuestStatus) || 'not_invited'

  const supabase = await createClient()

  const { error } = await supabase
    .from('guests')
    .insert({
      wedding_id,
      name,
      family_name,
      status,
    })

  if (error) {
    console.error('Error creating guest:', error)
    throw new Error(error.message || 'Could not create guest')
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
