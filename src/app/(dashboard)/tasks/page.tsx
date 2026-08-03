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

const TASK_CATEGORIES = [
  'Venue', 'Catering', 'Photography', 'Decoration', 'Attire',
  'Music & Entertainment', 'Invitations', 'Transport', 'Accommodation', 'Other',
]

const COLUMNS: { title: string; status: TaskStatus }[] = [
  { title: 'Pending', status: 'pending' },
  { title: 'In Progress', status: 'in_progress' },
  { title: 'Completed', status: 'completed' },
]

export default function TasksPage() {
  const { activeWedding } = useWedding()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeWedding) return
    async function load() {
      setLoading(true)
      const data = await getTasks(activeWedding!.id)
      setTasks(data)
      setLoading(false)
    }
    load()
  }, [activeWedding])

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
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t))
    await updateTaskStatus(taskId, newStatus)
  }

  async function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await deleteTask(taskId)
  }

  if (!activeWedding) return null

  return (
    /* Use fixed height relative to viewport so kanban columns are bounded and scrollable */
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
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
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="Other">
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger id="priority">
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

      {/* Kanban board — takes remaining height, columns individually scroll */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Loading tasks...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status)
            return (
              <div key={col.status} className="flex flex-col min-h-0 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/20 p-4">
                {/* Column header with count badge */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h2 className="font-semibold text-sm tracking-tight text-muted-foreground uppercase">
                    {col.title}
                  </h2>
                  <span className="text-xs bg-muted rounded-full px-2 py-0.5 font-medium text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>

                {/* Scrollable task list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colTasks.map((task) => (
                    <Card key={task.id} className="relative group hover:shadow-md transition-shadow">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between items-center gap-2">
                          <Badge
                            variant={
                              task.priority === 'high' ? 'destructive'
                                : task.priority === 'medium' ? 'default'
                                  : 'secondary'
                            }
                          >
                            {task.priority}
                          </Badge>
                          <Select
                            key={task.status}
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

                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs border-2 border-dashed rounded-lg">
                      No {col.title.toLowerCase()} tasks
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
