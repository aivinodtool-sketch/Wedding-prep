'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type Wedding = {
  id: string
  name: string
  date: string
  created_by: string
}

/**
 * Fetches all weddings the authenticated user is a member of.
 * Uses a direct join through wedding_members to avoid RLS recursion.
 */
export async function getUserWeddings(): Promise<Wedding[]> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Use admin client to bypass RLS and fetch wedding_ids for this user
  const { data: memberships, error: memberError } = await admin
    .from('wedding_members')
    .select('wedding_id')
    .eq('user_id', user.id)

  if (memberError || !memberships || memberships.length === 0) {
    return []
  }

  const weddingIds = memberships.map((m) => m.wedding_id)

  const { data, error } = await admin
    .from('weddings')
    .select('*')
    .in('id', weddingIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching weddings:', error)
    return []
  }

  return data as Wedding[]
}

/**
 * Creates a new wedding and adds the authenticated user as admin.
 * Uses admin client to bypass RLS, which causes infinite recursion on this table.
 */
export async function createWedding(formData: FormData) {
  const name = formData.get('name') as string
  const date = formData.get('date') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()

  // Insert wedding using admin client to bypass RLS
  const { data: wedding, error: weddingError } = await admin
    .from('weddings')
    .insert({
      name,
      date,
      created_by: user.id,
    })
    .select()
    .single()

  if (weddingError) {
    console.error('Error creating wedding:', weddingError)
    throw new Error('Could not create wedding')
  }

  // Insert the user as admin member using admin client
  const { error: memberError } = await admin
    .from('wedding_members')
    .insert({
      wedding_id: wedding.id,
      user_id: user.id,
      role: 'admin',
    })

  if (memberError) {
    console.error('Error adding wedding member:', memberError)
    throw new Error('Could not add member to wedding')
  }

  revalidatePath('/', 'layout')
  return wedding as Wedding
}
