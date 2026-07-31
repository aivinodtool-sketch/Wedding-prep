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

    return (data || []) as Task[]
  } catch (error) {
    console.error('Error in getTasks:', error)
    return []
  }
}

export async function createTask(formData: FormData) {
  const wedding_id = formData.get('wedding_id') as string
  const title = formData.get('title') as string
  const priority = (formData.get('priority') as TaskPriority) || 'medium'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .insert({
      wedding_id,
      title,
      priority,
      status: 'pending',
      created_by: user.id,
    })

  if (error) {
    console.error('Error creating task:', error)
    throw new Error(error.message || 'Could not create task')
  }

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

  revalidatePath('/tasks')
}
