'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Task = {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
}

const mockTasks: Task[] = [
  { id: '1', title: 'Book Photographer', status: 'pending', priority: 'high' },
  { id: '2', title: 'Finalize Guest List', status: 'in_progress', priority: 'medium' },
  { id: '3', title: 'Visit Venue', status: 'completed', priority: 'high' },
]

export default function TasksPage() {
  const [tasks] = useState<Task[]>(mockTasks)

  const columns = [
    { title: 'Pending', status: 'pending' },
    { title: 'In Progress', status: 'in_progress' },
    { title: 'Completed', status: 'completed' },
  ]

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {columns.map((col) => (
          <div key={col.status} className="flex flex-col h-full rounded-xl bg-zinc-100/50 dark:bg-zinc-800/20 p-4">
            <h2 className="font-semibold mb-4 text-sm tracking-tight text-muted-foreground uppercase">{col.title}</h2>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {tasks
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <Card key={task.id} className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center mt-2">
                        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                          {task.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
