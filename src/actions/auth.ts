'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Mock authentication - any credentials work for dummy account
  const cookieStore = await cookies()
  cookieStore.set('dummy-auth', 'true')

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  // Mock authentication - bypasses real Supabase signup
  const cookieStore = await cookies()
  cookieStore.set('dummy-auth', 'true')

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('dummy-auth')
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
