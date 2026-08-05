'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, LayoutGrid, List, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWedding } from '@/contexts/WeddingContext'
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask, Task, TaskStatus } from '@/actions/tasks'
import { getCategories, Category } from '@/actions/categories'
import { CategoryManager } from '@/components/modules/category-manager'
import { cn } from '@/lib/utils'

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
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [manageCatOpen, setManageCatOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'status' | 'category'>('status')
  const [activeMobileStatus, setActiveMobileStatus] = useState<TaskStatus>('pending')

  // Form selection states
  const [createCategory, setCreateCategory] = useState<string>('')
  const [createSubcategory, setCreateSubcategory] = useState<string>('')

  const [editCategory, setEditCategory] = useState<string>('')
  const [editSubcategory, setEditSubcategory] = useState<string>('')

  async function loadData() {
    if (!activeWedding) return
    setLoading(true)
    const [t, c] = await Promise.all([
      getTasks(activeWedding.id),
      getCategories(activeWedding.id),
    ])
    setTasks(t)
    setCategories(c)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [activeWedding])

  async function handleCreateTask(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    if (createCategory) formData.append('category', createCategory)
    if (createSubcategory) formData.append('subcategory', createSubcategory)

    await createTask(formData)
    setIsCreateOpen(false)
    setCreateCategory('')
    setCreateSubcategory('')
    await loadData()
  }

  async function handleEditTask(formData: FormData) {
    if (!editingTask || !activeWedding) return
    if (editCategory) formData.append('category', editCategory)
    if (editSubcategory) formData.append('subcategory', editSubcategory)

    await updateTask(editingTask.id, formData)
    setEditingTask(null)
    await loadData()
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

  // Active subcategory options based on selected category
  const createSubcategoryOptions =
    categories.find((c) => c.name === createCategory)?.children || []
  const editSubcategoryOptions =
    categories.find((c) => c.name === editCategory)?.children || []

  if (!activeWedding) return null

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] space-y-6">
      {/* Category Manager Component Modal */}
      <CategoryManager
        weddingId={activeWedding.id}
        open={manageCatOpen}
        onOpenChange={setManageCatOpen}
        onCategoriesUpdated={loadData}
      />

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks & Checklist</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Organize tasks by custom categories and subcategories
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

          {/* Manage Categories */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => setManageCatOpen(true)}
          >
            <FolderTree className="mr-1.5 h-4 w-4" />
            Manage Categories
          </Button>

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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={createCategory}
                      onValueChange={(val) => {
                        setCreateCategory(val ?? '')
                        setCreateSubcategory('')
                      }}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Select
                      value={createSubcategory}
                      onValueChange={(val) => val != null && setCreateSubcategory(val)}
                      disabled={!createCategory || createSubcategoryOptions.length === 0}
                    >
                      <SelectTrigger id="subcategory">
                        <SelectValue placeholder="Select Sub" />
                      </SelectTrigger>
                      <SelectContent>
                        {createSubcategoryOptions.map((sub) => (
                          <SelectItem key={sub.id} value={sub.name}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
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
        <Dialog
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTask(null)
              setEditCategory('')
              setEditSubcategory('')
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <form action={handleEditTask} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Task Title</Label>
                <Input id="edit-title" name="title" defaultValue={editingTask.title} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-cat">Category</Label>
                  <Select
                    value={editCategory || editingTask.category || ''}
                    onValueChange={(val) => {
                      setEditCategory(val ?? '')
                      setEditSubcategory('')
                    }}
                  >
                    <SelectTrigger id="edit-cat">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-subcat">Subcategory</Label>
                  <Select
                    value={editSubcategory || editingTask.subcategory || ''}
                    onValueChange={(val) => val != null && setEditSubcategory(val)}
                    disabled={!editCategory && !editingTask.category}
                  >
                    <SelectTrigger id="edit-subcat">
                      <SelectValue placeholder="Select Sub" />
                    </SelectTrigger>
                    <SelectContent>
                      {editSubcategoryOptions.map((sub) => (
                        <SelectItem key={sub.id} value={sub.name}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingTask(null)
                    setEditCategory('')
                    setEditSubcategory('')
                  }}
                >
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
        /* KANBAN STATUS VIEW */
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex md:hidden border-b mb-4 overflow-x-auto gap-2 pb-1">
            {COLUMNS.map((col) => {
              const count = tasks.filter((t) => t.status === col.status).length
              const isActive = activeMobileStatus === col.status
              return (
                <button
                  key={col.status}
                  onClick={() => setActiveMobileStatus(col.status)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', col.dotClass)} />
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
                    'flex flex-col min-h-0 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/20 p-4 border border-zinc-200/60 dark:border-zinc-800/60',
                    isHiddenOnMobile ? 'hidden md:flex' : 'flex'
                  )}
                >
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', col.dotClass)} />
                      <h2 className="font-semibold text-xs tracking-wide uppercase text-zinc-700 dark:text-zinc-300">
                        {col.title}
                      </h2>
                    </div>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', col.badgeClass)}>
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[200px]">
                    {colTasks.map((task) => (
                      <Card
                        key={task.id}
                        className={cn(
                          'relative group hover:shadow-md transition-all border-l-4',
                          col.borderClass
                        )}
                      >
                        <CardHeader className="p-3.5 pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                                {task.title}
                              </CardTitle>

                              {task.category && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                                    {task.category}
                                    {task.subcategory ? ` > ${task.subcategory}` : ''}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  setEditingTask(task)
                                  setEditCategory(task.category || '')
                                  setEditSubcategory(task.subcategory || '')
                                }}
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
                                task.priority === 'high'
                                  ? 'destructive'
                                  : task.priority === 'medium'
                                  ? 'default'
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
        /* CATEGORY & SUBCATEGORY GROUPED VIEW */
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryTasks = tasks.filter((t) => t.category === category.name)

            return (
              <div
                key={category.id}
                className="rounded-xl border bg-card p-4 shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                      {category.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {categoryTasks.length} {categoryTasks.length === 1 ? 'task' : 'tasks'}
                    </Badge>
                  </div>
                </div>

                {categoryTasks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryTasks.map((task) => {
                      const colMeta = COLUMNS.find((c) => c.status === task.status) || COLUMNS[0]
                      return (
                        <Card key={task.id} className={cn('border-l-4 p-3.5 space-y-2', colMeta.borderClass)}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                {task.title}
                              </span>
                              {task.subcategory && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Sub: <span className="font-medium text-foreground">{task.subcategory}</span>
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  setEditingTask(task)
                                  setEditCategory(task.category || '')
                                  setEditSubcategory(task.subcategory || '')
                                }}
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
                          <div className="flex items-center justify-between gap-2 text-xs pt-1">
                            <Badge
                              variant={
                                task.priority === 'high'
                                  ? 'destructive'
                                  : task.priority === 'medium'
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-[10px] px-1.5 py-0 uppercase font-semibold"
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
                    No tasks in this category yet.
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
