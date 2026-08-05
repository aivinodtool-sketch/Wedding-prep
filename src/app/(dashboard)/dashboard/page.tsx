'use client'

import { useState, useEffect } from 'react'
import {
  CheckSquare,
  Users,
  Calendar,
  Plus,
  Store,
  ShoppingCart,
  FolderTree,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useWedding } from '@/contexts/WeddingContext'
import { getTasks, createTask, Task } from '@/actions/tasks'
import { getGuests, createGuest, Guest } from '@/actions/guests'
import { getVendors, createVendor, Vendor } from '@/actions/vendors'
import { getShoppingItems, createShoppingItem, ShoppingItem } from '@/actions/shopping'
import { getCategories, Category } from '@/actions/categories'
import { CategoryManager } from '@/components/modules/category-manager'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { activeWedding } = useWedding()

  const [tasks, setTasks] = useState<Task[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog open states for Quick Add
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addGuestOpen, setAddGuestOpen] = useState(false)
  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [addShoppingOpen, setAddShoppingOpen] = useState(false)
  const [manageCatOpen, setManageCatOpen] = useState(false)

  // Form selected category & subcategory states
  const [selectedTaskCategory, setSelectedTaskCategory] = useState<string>('')
  const [selectedTaskSubcategory, setSelectedTaskSubcategory] = useState<string>('')

  const [selectedVendorCategory, setSelectedVendorCategory] = useState<string>('')
  const [selectedVendorSubcategory, setSelectedVendorSubcategory] = useState<string>('')

  const [selectedShoppingCategory, setSelectedShoppingCategory] = useState<string>('')
  const [selectedShoppingSubcategory, setSelectedShoppingSubcategory] = useState<string>('')

  async function loadAllData() {
    if (!activeWedding) return
    setLoading(true)
    const [t, g, v, s, c] = await Promise.all([
      getTasks(activeWedding.id),
      getGuests(activeWedding.id),
      getVendors(activeWedding.id),
      getShoppingItems(activeWedding.id),
      getCategories(activeWedding.id),
    ])
    setTasks(t)
    setGuests(g)
    setVendors(v)
    setShoppingItems(s)
    setCategories(c)
    setLoading(false)
  }

  useEffect(() => {
    loadAllData()
  }, [activeWedding])

  if (!activeWedding) return null

  // Calculate stats
  const weddingDate = new Date(activeWedding.date)
  const today = new Date()
  const diffTime = weddingDate.getTime() - today.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const pendingTasks = tasks.filter((t) => t.status !== 'completed')
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const totalGuests = guests.length
  const attendingGuests = guests.filter((g) => g.status === 'attending').length
  const rsvpCount = guests.filter((g) => g.status === 'attending' || g.status === 'declined').length
  const guestResponseRate = totalGuests > 0 ? Math.round((rsvpCount / totalGuests) * 100) : 0

  const totalVendorBudget = vendors.reduce((acc, v) => acc + (v.total_amount || 0), 0)
  const totalVendorPaid = vendors.reduce((acc, v) => acc + (v.advance_paid || 0), 0)

  const totalShoppingEst = shoppingItems.reduce((acc, s) => acc + (s.estimated_cost || 0), 0)
  const totalShoppingActual = shoppingItems.reduce((acc, s) => acc + (s.actual_cost || 0), 0)

  // Quick Add Handlers
  async function handleQuickCreateTask(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    if (selectedTaskCategory) formData.append('category', selectedTaskCategory)
    if (selectedTaskSubcategory) formData.append('subcategory', selectedTaskSubcategory)
    await createTask(formData)
    setAddTaskOpen(false)
    setSelectedTaskCategory('')
    setSelectedTaskSubcategory('')
    await loadAllData()
  }

  async function handleQuickCreateGuest(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    await createGuest(formData)
    setAddGuestOpen(false)
    await loadAllData()
  }

  async function handleQuickCreateVendor(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    if (selectedVendorCategory) formData.append('category', selectedVendorCategory)
    if (selectedVendorSubcategory) formData.append('subcategory', selectedVendorSubcategory)
    await createVendor(formData)
    setAddVendorOpen(false)
    setSelectedVendorCategory('')
    setSelectedVendorSubcategory('')
    await loadAllData()
  }

  async function handleQuickCreateShopping(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    if (selectedShoppingCategory) formData.append('category', selectedShoppingCategory)
    if (selectedShoppingSubcategory) formData.append('subcategory', selectedShoppingSubcategory)
    await createShoppingItem(formData)
    setAddShoppingOpen(false)
    setSelectedShoppingCategory('')
    setSelectedShoppingSubcategory('')
    await loadAllData()
  }

  // Get active children subcategories for selected parent category
  const activeTaskSubcategories =
    categories.find((c) => c.name === selectedTaskCategory)?.children || []
  const activeVendorSubcategories =
    categories.find((c) => c.name === selectedVendorCategory)?.children || []
  const activeShoppingSubcategories =
    categories.find((c) => c.name === selectedShoppingCategory)?.children || []

  return (
    <div className="space-y-8">
      {/* Category Manager Modal Triggered from Dashboard */}
      <CategoryManager
        weddingId={activeWedding.id}
        open={manageCatOpen}
        onOpenChange={setManageCatOpen}
        onCategoriesUpdated={loadAllData}
      />

      {/* Hero Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium text-white">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Wedding Command Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {activeWedding.name}
            </h1>
            <p className="text-sm sm:text-base text-rose-100 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {weddingDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20">
            <Clock className="h-8 w-8 text-amber-300 animate-pulse" />
            <div>
              <div className="text-3xl font-black">{daysRemaining}</div>
              <div className="text-xs uppercase tracking-wider text-rose-100 font-semibold">
                Days Remaining
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Hub Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Quick Actions
          </h2>
          <span className="text-xs text-muted-foreground">Add items directly to your planner</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Add Task Button & Modal */}
          <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
            <DialogTrigger render={
              <Button
                variant="outline"
                className="h-14 flex items-center justify-start gap-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 hover:from-amber-500/20 hover:to-amber-500/10 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold"
              >
                <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 shadow-xs">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-semibold">+ Task</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Add checklist item</div>
                </div>
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Task from Dashboard</DialogTitle>
              </DialogHeader>
              <form action={handleQuickCreateTask} className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input id="task-title" name="title" placeholder="e.g. Finalize Catering Menu" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="task-cat">Category</Label>
                    <Select
                      value={selectedTaskCategory}
                      onValueChange={(val) => {
                        setSelectedTaskCategory(val ?? '')
                        setSelectedTaskSubcategory('')
                      }}
                    >
                      <SelectTrigger id="task-cat">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-subcat">Subcategory</Label>
                    <Select
                      value={selectedTaskSubcategory}
                      onValueChange={(val) => val != null && setSelectedTaskSubcategory(val)}
                      disabled={!selectedTaskCategory || activeTaskSubcategories.length === 0}
                    >
                      <SelectTrigger id="task-subcat">
                        <SelectValue placeholder="Select Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTaskSubcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.name}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger id="task-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Create Task</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Guest Button & Modal */}
          <Dialog open={addGuestOpen} onOpenChange={setAddGuestOpen}>
            <DialogTrigger render={
              <Button
                variant="outline"
                className="h-14 flex items-center justify-start gap-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 hover:from-emerald-500/20 hover:to-emerald-500/10 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200 font-semibold"
              >
                <div className="p-2 rounded-lg bg-emerald-500 text-white shrink-0 shadow-xs">
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-semibold">+ Guest</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Add to invite list</div>
                </div>
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Guest from Dashboard</DialogTitle>
              </DialogHeader>
              <form action={handleQuickCreateGuest} className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="guest-name">Guest Name</Label>
                  <Input id="guest-name" name="name" placeholder="John & Sarah Doe" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="family_name">Group / Family</Label>
                    <Input id="family_name" name="family_name" placeholder="Bride's Family" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guest-phone">Phone</Label>
                    <Input id="guest-phone" name="phone" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="guest-status">RSVP Status</Label>
                    <Select name="status" defaultValue="not_invited">
                      <SelectTrigger id="guest-status">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_invited">Not Invited Yet</SelectItem>
                        <SelectItem value="invited">Invited</SelectItem>
                        <SelectItem value="attending">Attending</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="food_preference">Food Preference</Label>
                    <Input id="food_preference" name="food_preference" placeholder="Veg / Non-Veg" />
                  </div>
                </div>
                <Button type="submit" className="w-full">Save Guest</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Vendor Button & Modal */}
          <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
            <DialogTrigger render={
              <Button
                variant="outline"
                className="h-14 flex items-center justify-start gap-3 bg-gradient-to-br from-sky-500/10 to-sky-500/5 hover:from-sky-500/20 hover:to-sky-500/10 border-sky-200 dark:border-sky-900/50 text-sky-900 dark:text-sky-200 font-semibold"
              >
                <div className="p-2 rounded-lg bg-sky-500 text-white shrink-0 shadow-xs">
                  <Store className="h-4 w-4" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-semibold">+ Vendor</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Add service provider</div>
                </div>
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Vendor from Dashboard</DialogTitle>
              </DialogHeader>
              <form action={handleQuickCreateVendor} className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name">Business / Vendor Name</Label>
                  <Input id="vendor-name" name="name" placeholder="Grand Royal Palace" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-cat">Category</Label>
                    <Select
                      value={selectedVendorCategory}
                      onValueChange={(val) => {
                        setSelectedVendorCategory(val ?? '')
                        setSelectedVendorSubcategory('')
                      }}
                    >
                      <SelectTrigger id="vendor-cat">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-subcat">Subcategory</Label>
                    <Select
                      value={selectedVendorSubcategory}
                      onValueChange={(val) => val != null && setSelectedVendorSubcategory(val)}
                      disabled={!selectedVendorCategory || activeVendorSubcategories.length === 0}
                    >
                      <SelectTrigger id="vendor-subcat">
                        <SelectValue placeholder="Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeVendorSubcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.name}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-total">Total Amount ($)</Label>
                    <Input id="vendor-total" name="total_amount" type="number" step="0.01" placeholder="5000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vendor-advance">Advance Paid ($)</Label>
                    <Input id="vendor-advance" name="advance_paid" type="number" step="0.01" placeholder="1000" defaultValue="0" />
                  </div>
                </div>
                <Button type="submit" className="w-full">Save Vendor</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Shopping Item Button & Modal */}
          <Dialog open={addShoppingOpen} onOpenChange={setAddShoppingOpen}>
            <DialogTrigger render={
              <Button
                variant="outline"
                className="h-14 flex items-center justify-start gap-3 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:from-purple-500/20 hover:to-purple-500/10 border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-200 font-semibold"
              >
                <div className="p-2 rounded-lg bg-purple-500 text-white shrink-0 shadow-xs">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-semibold">+ Shopping</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Add purchase item</div>
                </div>
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Shopping Item from Dashboard</DialogTitle>
              </DialogHeader>
              <form action={handleQuickCreateShopping} className="space-y-4 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="shop-name">Item Name</Label>
                  <Input id="shop-name" name="name" placeholder="Wedding Saree / Suit" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="shop-cat">Category</Label>
                    <Select
                      value={selectedShoppingCategory}
                      onValueChange={(val) => {
                        setSelectedShoppingCategory(val ?? '')
                        setSelectedShoppingSubcategory('')
                      }}
                    >
                      <SelectTrigger id="shop-cat">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop-subcat">Subcategory</Label>
                    <Select
                      value={selectedShoppingSubcategory}
                      onValueChange={(val) => val != null && setSelectedShoppingSubcategory(val)}
                      disabled={!selectedShoppingCategory || activeShoppingSubcategories.length === 0}
                    >
                      <SelectTrigger id="shop-subcat">
                        <SelectValue placeholder="Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeShoppingSubcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.name}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
                    <Input id="estimated_cost" name="estimated_cost" type="number" step="0.01" placeholder="800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actual_cost">Actual Cost ($)</Label>
                    <Input id="actual_cost" name="actual_cost" type="number" step="0.01" placeholder="0" />
                  </div>
                </div>
                <Button type="submit" className="w-full">Save Item</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Manage Categories Button */}
          <Button
            variant="outline"
            onClick={() => setManageCatOpen(true)}
            className="h-14 flex items-center justify-start gap-3 bg-gradient-to-br from-zinc-500/10 to-zinc-500/5 hover:from-zinc-500/20 hover:to-zinc-500/10 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold col-span-2 sm:col-span-1"
          >
            <div className="p-2 rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shrink-0 shadow-xs">
              <FolderTree className="h-4 w-4" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold">Categories</div>
              <div className="text-[10px] text-muted-foreground font-normal">Edit categories & subs</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Main Overview Stats Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tasks Stats Card */}
        <Card className="relative overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Overview</CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black">{completedTasks} / {totalTasks}</div>
              <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 font-semibold">
                {taskProgress}% done
              </Badge>
            </div>
            <Progress value={taskProgress} className="h-2 bg-amber-100" />
            <p className="text-xs text-muted-foreground">{pendingTasks.length} pending tasks remaining</p>
          </CardContent>
        </Card>

        {/* Guest RSVPs Card */}
        <Card className="relative overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Guest RSVPs</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black">{attendingGuests} Attending</div>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold">
                {guestResponseRate}% RSVP rate
              </Badge>
            </div>
            <Progress value={guestResponseRate} className="h-2 bg-emerald-100" />
            <p className="text-xs text-muted-foreground">{totalGuests} total guests invited</p>
          </CardContent>
        </Card>

        {/* Vendors Budget Card */}
        <Card className="relative overflow-hidden border-l-4 border-l-sky-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendor Bookings</CardTitle>
            <Store className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black">{vendors.length} Vendors</div>
              <span className="text-xs font-bold text-sky-600">${totalVendorPaid.toLocaleString()} paid</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Total Budget: <span className="font-semibold">${totalVendorBudget.toLocaleString()}</span>
            </p>
          </CardContent>
        </Card>

        {/* Shopping Budget Card */}
        <Card className="relative overflow-hidden border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Shopping Summary</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black">{shoppingItems.length} Items</div>
              <span className="text-xs font-bold text-purple-600">
                {shoppingItems.filter((i) => i.is_purchased).length} purchased
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Est. ${totalShoppingEst.toLocaleString()} • Actual ${totalShoppingActual.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* Pending Tasks Panel */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Upcoming Tasks</CardTitle>
              <CardDescription>Tasks needing immediate attention</CardDescription>
            </div>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="text-xs text-primary">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Loading tasks...</p>
            ) : pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100/60 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full shrink-0',
                          task.status === 'in_progress' ? 'bg-sky-500' : 'bg-amber-500'
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize font-medium text-amber-700 dark:text-amber-400">
                            {task.priority} priority
                          </span>
                          {task.category && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                                {task.category}
                                {task.subcategory ? ` > ${task.subcategory}` : ''}
                              </Badge>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'text-[10px] uppercase font-semibold shrink-0',
                        task.status === 'in_progress'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      )}
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-lg text-xs text-muted-foreground">
                🎉 No pending tasks! Click &quot;+ Task&quot; above to add one.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Summary Cards */}
        <div className="lg:col-span-3 space-y-6">
          {/* Vendor Quick Card */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Recent Vendors</CardTitle>
                <CardDescription>Booked service providers</CardDescription>
              </div>
              <Link href="/vendors">
                <Button variant="ghost" size="sm" className="text-xs text-primary">
                  All Vendors <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {vendors.length > 0 ? (
                <div className="space-y-2">
                  {vendors.slice(0, 4).map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-xs p-2.5 border-b last:border-0">
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{v.name}</div>
                        <div className="text-muted-foreground">
                          {v.category}
                          {v.subcategory ? ` • ${v.subcategory}` : ''}
                        </div>
                      </div>
                      <div className="text-right font-medium">
                        <div>${v.total_amount.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          ${v.advance_paid.toLocaleString()} paid
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4 italic">
                  No vendors added yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Guest Group Breakdown Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Category Breakdown</CardTitle>
              <CardDescription>Custom categories configured</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="secondary"
                    className="text-xs py-1 px-2.5 flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  >
                    <FolderTree className="h-3 w-3 text-primary" />
                    <span>{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <span className="text-[10px] opacity-70">({cat.children.length})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
