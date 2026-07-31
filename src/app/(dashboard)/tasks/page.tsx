'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWedding } from '@/contexts/WeddingContext'
import { getTasks, createTask, updateTaskStatus, deleteTask, Task, TaskStatus } from '@/actions/tasks'

export default function TasksPage() {
  const { activeWedding } = useWedding()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTasks() {
      if (activeWedding) {
        setLoading(true)
        const data = await getTasks(activeWedding.id)
        setTasks(data)
        setLoading(false)
      }
    }
    loadTasks()
  }, [activeWedding])

  const columns = [
    { title: 'Pending', status: 'pending' },
    { title: 'In Progress', status: 'in_progress' },
    { title: 'Completed', status: 'completed' },
  ]

  async function handleCreateTask(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    await createTask(formData)
    setIsDialogOpen(false)
    const newTasks = await getTasks(activeWedding.id)
    setTasks(newTasks)
  }

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    if (!activeWedding) return
    await updateTaskStatus(taskId, newStatus)
    const newTasks = await getTasks(activeWedding.id)
    setTasks(newTasks)
  }

  async function handleDeleteTask(taskId: string) {
    if (!activeWedding) return
    await deleteTask(taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  if (!activeWedding) return null

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form action={handleCreateTask} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input id="title" name="title" placeholder="Book Venue, Order Flowers..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Save Task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
          {columns.map((col) => (
            <div key={col.status} className="flex flex-col h-full rounded-xl bg-zinc-100/50 dark:bg-zinc-800/20 p-4">
              <h2 className="font-semibold mb-4 text-sm tracking-tight text-muted-foreground uppercase">{col.title}</h2>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {tasks
                  .filter((t) => t.status === col.status)
                  .map((task) => (
                    <Card key={task.id} className="relative group hover:shadow-md transition-shadow">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start pr-6">
                          <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between items-center mt-2">
                          <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                            {task.priority}
                          </Badge>
                          <Select
                            defaultValue={task.status}
                            onValueChange={(val) => {
                              if (val) handleStatusChange(task.id, val as TaskStatus)
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs border-0 w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
