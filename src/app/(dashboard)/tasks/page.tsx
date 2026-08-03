'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWedding } from '@/contexts/WeddingContext'
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask, Task, TaskStatus } from '@/actions/tasks'
import { cn } from '@/lib/utils'

const DEFAULT_CATEGORIES = [
  'Venue', 'Bridal Related', 'Photography', 'Decoration', 'Attire',
  'Music & Entertainment', 'Shopping', 'Transport', 'Accommodation', 'Other',
]

const COLUMNS: { title: string; status: TaskStatus; colorClass: string; badgeClass: string; dotClass: string; borderClass: string }[] = [
  {
    title: 'Pending',
    status: 'pending',
    colorClass: 'text-amber-700 dark:text-amber-300',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-500',
  },
  {
    title: 'In Progress',
    status: 'in_progress',
    colorClass: 'text-sky-700 dark:text-sky-300',
    badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    dotClass: 'bg-sky-500',
    borderClass: 'border-l-sky-500',
  },
  {
    title: 'Completed',
    status: 'completed',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-l-emerald-500',
  },
]

export default function TasksPage() {
  const { activeWedding } = useWedding()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState<'status' | 'category'>('status')
  const [activeMobileStatus, setActiveMobileStatus] = useState<TaskStatus>('pending')
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
    setIsCreateOpen(false)
    const newTasks = await getTasks(activeWedding.id)
    setTasks(newTasks)
  }

  async function handleEditTask(formData: FormData) {
    if (!editingTask || !activeWedding) return
    await updateTask(editingTask.id, formData)
    setEditingTask(null)
    const newTasks = await getTasks(activeWedding.id)
    setTasks(newTasks)
  }

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    if (!activeWedding) return
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
    await updateTaskStatus(taskId, newStatus)
  }

  async function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await deleteTask(taskId)
  }

  // Task reordering within a list
  function moveTask(taskId: string, direction: 'up' | 'down') {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === taskId)
      if (idx === -1) return prev
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= prev.length) return prev

      const next = [...prev]
      const [moved] = next.splice(idx, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
  }

  // Category reordering
  function moveCategory(categoryName: string, direction: 'up' | 'down') {
    setCategories((prev) => {
      const idx = prev.indexOf(categoryName)
      if (idx === -1) return prev
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= prev.length) return prev

      const next = [...prev]
      const [moved] = next.splice(idx, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
  }

  if (!activeWedding) return null

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Organize, edit, and track your wedding tasks
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="inline-flex items-center rounded-lg border p-1 bg-zinc-100 dark:bg-zinc-800">
            <Button
              variant={viewMode === 'status' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode('status')}
            >
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
              Status
            </Button>
            <Button
              variant={viewMode === 'category' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setViewMode('category')}
            >
              <List className="mr-1.5 h-3.5 w-3.5" />
              Category
            </Button>
          </div>

          {/* Add Task Button */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button size="sm" className="h-9">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Task
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
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
                      {categories.map((cat) => (
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
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form action={handleEditTask} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Task Title</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editingTask.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select name="category" defaultValue={editingTask.description || 'Other'}>
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Select name="priority" defaultValue={editingTask.priority}>
                  <SelectTrigger id="edit-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={editingTask.status}>
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button type="submit">Update Task</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
          Loading tasks...
        </div>
      ) : viewMode === 'status' ? (
        /* STATUS KANBAN VIEW */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Mobile Status Tabs */}
          <div className="flex md:hidden border-b mb-4 overflow-x-auto gap-2 pb-1">
            {COLUMNS.map((col) => {
              const count = tasks.filter((t) => t.status === col.status).length
              const isActive = activeMobileStatus === col.status
              return (
                <button
                  key={col.status}
                  onClick={() => setActiveMobileStatus(col.status)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", col.dotClass)} />
                  {col.title} ({count})
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
            {COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.status)
              const isHiddenOnMobile = activeMobileStatus !== col.status

              return (
                <div
                  key={col.status}
                  className={cn(
                    "flex flex-col min-h-0 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/20 p-4 border border-zinc-200/60 dark:border-zinc-800/60",
                    isHiddenOnMobile ? "hidden md:flex" : "flex"
                  )}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", col.dotClass)} />
                      <h2 className="font-semibold text-xs tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
                        {col.title}
                      </h2>
                    </div>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", col.badgeClass)}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Scrollable Tasks */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px]">
                    {colTasks.map((task, idx) => (
                      <Card
                        key={task.id}
                        className={cn(
                          "relative group hover:shadow-md transition-all border-l-4",
                          col.borderClass
                        )}
                      >
                        <CardHeader className="p-3.5 pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                                {task.title}
                              </CardTitle>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => moveTask(task.id, 'up')}
                                disabled={idx === 0}
                                title="Move up"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => moveTask(task.id, 'down')}
                                disabled={idx === colTasks.length - 1}
                                title="Move down"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => setEditingTask(task)}
                                title="Edit task"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteTask(task.id)}
                                title="Delete task"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-3.5 pt-0">
                          <div className="flex justify-between items-center gap-2 mt-2">
                            <Badge
                              variant={
                                task.priority === 'high' ? 'destructive'
                                  : task.priority === 'medium' ? 'default'
                                    : 'secondary'
                              }
                              className="text-[10px] px-2 py-0 uppercase tracking-wider font-semibold"
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
                              <SelectTrigger className="h-7 text-xs border bg-background w-[115px]">
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
        </div>
      ) : (
        /* CATEGORY VIEW WITH REORDERABLE CATEGORIES */
        <div className="space-y-6">
          {categories.map((category, catIdx) => {
            const categoryTasks = tasks.filter((t) => (t.description || 'Other') === category)
            return (
              <div
                key={category}
                className="rounded-xl border bg-white dark:bg-zinc-950 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
                      {category}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {categoryTasks.length} {categoryTasks.length === 1 ? 'task' : 'tasks'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => moveCategory(category, 'up')}
                      disabled={catIdx === 0}
                      title="Move category up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => moveCategory(category, 'down')}
                      disabled={catIdx === categories.length - 1}
                      title="Move category down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {categoryTasks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryTasks.map((task) => {
                      const colMeta = COLUMNS.find((c) => c.status === task.status) || COLUMNS[0]
                      return (
                        <Card key={task.id} className={cn("border-l-4 p-3 space-y-2", colMeta.borderClass)}>
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                              {task.title}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => setEditingTask(task)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className={cn("px-2 py-0.5 rounded font-semibold text-[10px]", colMeta.badgeClass)}>
                              {colMeta.title}
                            </span>
                            <Select
                              key={task.status}
                              defaultValue={task.status}
                              onValueChange={(val) => {
                                if (val) handleStatusChange(task.id, val as TaskStatus)
                              }}
                            >
                              <SelectTrigger className="h-6 text-[11px] border w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-2 italic">
                    No tasks in this category.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
