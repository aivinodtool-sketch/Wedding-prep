'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  wedding_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  category: string | null
  subcategory: string | null
}

export async function getTasks(weddingId: string): Promise<Task[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return []
    }

    return (data || []).map((t) => {
      let category = t.category || null
      let subcategory = t.subcategory || null

      // Parse legacy description field if category is not stored separately
      if (!category && t.description) {
        if (t.description.includes(' > ')) {
          const parts = t.description.split(' > ')
          category = parts[0]
          subcategory = parts[1]
        } else {
          category = t.description
        }
      }

      return {
        ...t,
        category,
        subcategory,
      } as Task
    })
  } catch (error) {
    console.error('Error in getTasks:', error)
    return []
  }
}

export async function createTask(formData: FormData) {
  const wedding_id = formData.get('wedding_id') as string
  const title = formData.get('title') as string
  const priority = (formData.get('priority') as TaskPriority) || 'medium'
  const category = (formData.get('category') as string) || null
  const subcategory = (formData.get('subcategory') as string) || null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Combine category > subcategory in description for full backward compatibility
  const combinedCategory = subcategory ? `${category} > ${subcategory}` : category

  const { error } = await supabase
    .from('tasks')
    .insert({
      wedding_id,
      title,
      priority,
      status: 'pending',
      created_by: user.id,
      description: combinedCategory,
    })

  if (error) {
    console.error('Error creating task:', error)
    throw new Error(error.message || 'Could not create task')
  }

  revalidatePath('/dashboard')
  revalidatePath('/tasks')
}

export async function updateTask(taskId: string, formData: FormData) {
  const title = formData.get('title') as string
  const priority = (formData.get('priority') as TaskPriority) || 'medium'
  const category = (formData.get('category') as string) || null
  const subcategory = (formData.get('subcategory') as string) || null
  const status = (formData.get('status') as TaskStatus) || 'pending'

  const combinedCategory = subcategory ? `${category} > ${subcategory}` : category

  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      priority,
      status,
      description: combinedCategory,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task:', error)
    throw new Error(error.message || 'Could not update task')
  }

  revalidatePath('/dashboard')
  revalidatePath('/tasks')
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task:', error)
    throw new Error(error.message || 'Could not update task')
  }

  revalidatePath('/dashboard')
  revalidatePath('/tasks')
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    throw new Error(error.message || 'Could not delete task')
  }

  revalidatePath('/dashboard')
  revalidatePath('/tasks')
}
