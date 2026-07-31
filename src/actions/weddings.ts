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
 * Tries admin client first (if key configured), falls back gracefully to user client.
 */
export async function getUserWeddings(): Promise<Wedding[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const admin = createAdminClient()

    if (admin) {
      const { data: memberships } = await admin
        .from('wedding_members')
        .select('wedding_id')
        .eq('user_id', user.id)

      if (memberships && memberships.length > 0) {
        const weddingIds = memberships.map((m) => m.wedding_id)
        const { data } = await admin
          .from('weddings')
          .select('*')
          .in('id', weddingIds)
          .order('created_at', { ascending: false })

        if (data && data.length > 0) return data as Wedding[]
      }
    }

    // Fallback: standard client user query
    const { data } = await supabase
      .from('weddings')
      .select('*')
      .order('created_at', { ascending: false })

    return (data || []) as Wedding[]
  } catch (error) {
    console.error('Error fetching user weddings:', error)
    return []
  }
}

/**
 * Creates a new wedding and adds the authenticated user as admin.
 */
export async function createWedding(formData: FormData) {
  const name = formData.get('name') as string
  const date = formData.get('date') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const db = admin || supabase

  const { data: wedding, error: weddingError } = await db
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
    throw new Error(weddingError.message || 'Could not create wedding')
  }

  const { error: memberError } = await db
    .from('wedding_members')
    .insert({
      wedding_id: wedding.id,
      user_id: user.id,
      role: 'admin',
    })

  if (memberError) {
    console.error('Error adding wedding member:', memberError)
    // Non-fatal if created_by constraint handles access
  }

  revalidatePath('/', 'layout')
  return wedding as Wedding
}
