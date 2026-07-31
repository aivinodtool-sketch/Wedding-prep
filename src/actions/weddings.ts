'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserWeddings() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('weddings')
    .select('*')

  if (error) {
    console.error('Error fetching weddings:', error)
    return []
  }

  return data
}

export async function createWedding(formData: FormData) {
  const name = formData.get('name') as string
  const date = formData.get('date') as string
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Insert wedding
  const { data: wedding, error: weddingError } = await supabase
    .from('weddings')
    .insert({
      name,
      date,
      created_by: user.id
    })
    .select()
    .single()

  if (weddingError) {
    console.error('Error creating wedding:', weddingError)
    throw new Error('Could not create wedding')
  }

  // Insert member
  const { error: memberError } = await supabase
    .from('wedding_members')
    .insert({
      wedding_id: wedding.id,
      user_id: user.id,
      role: 'admin'
    })

  if (memberError) {
    console.error('Error adding wedding member:', memberError)
    throw new Error('Could not add member to wedding')
  }

  revalidatePath('/dashboard', 'layout')
  return wedding
}
