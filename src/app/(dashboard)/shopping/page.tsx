'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, Trash2, FolderTree, ShoppingBag, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWedding } from '@/contexts/WeddingContext'
import {
  getShoppingItems,
  createShoppingItem,
  toggleItemPurchased,
  deleteShoppingItem,
  ShoppingItem,
} from '@/actions/shopping'
import { getCategories, Category } from '@/actions/categories'
import { CategoryManager } from '@/components/modules/category-manager'

export default function ShoppingPage() {
  const { activeWedding } = useWedding()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [manageCatOpen, setManageCatOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form selection states
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')

  async function loadData() {
    if (!activeWedding) return
    setLoading(true)
    const [s, c] = await Promise.all([
      getShoppingItems(activeWedding.id),
      getCategories(activeWedding.id),
    ])
    setItems(s)
    setCategories(c)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [activeWedding])

  async function handleCreateItem(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    if (selectedCategory) formData.append('category', selectedCategory)
    if (selectedSubcategory) formData.append('subcategory', selectedSubcategory)

    await createShoppingItem(formData)
    setIsDialogOpen(false)
    setSelectedCategory('')
    setSelectedSubcategory('')
    await loadData()
  }

  async function handleTogglePurchased(id: string, currentPurchased: boolean) {
    if (!activeWedding) return
    await toggleItemPurchased(id, !currentPurchased)
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_purchased: !currentPurchased } : item))
    )
  }

  async function handleDeleteItem(id: string) {
    if (!activeWedding) return
    await deleteShoppingItem(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const subcategoryOptions =
    categories.find((c) => c.name === selectedCategory)?.children || []

  // Stats calculations
  const totalEst = items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0)
  const totalActual = items.reduce((sum, item) => sum + (item.actual_cost || 0), 0)
  const purchasedCount = items.filter((i) => i.is_purchased).length

  if (!activeWedding) return null

  return (
    <div className="space-y-6">
      {/* Category Manager Component Modal */}
      <CategoryManager
        weddingId={activeWedding.id}
        open={manageCatOpen}
        onOpenChange={setManageCatOpen}
        onCategoriesUpdated={loadData}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Shopping List</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track purchases, budgets, categories, and subcategories
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={() => setManageCatOpen(true)}
          >
            <FolderTree className="mr-1.5 h-4 w-4" />
            Manage Categories
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <Button size="sm" className="h-9">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Item
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Shopping Item</DialogTitle>
              </DialogHeader>
              <form action={handleCreateItem} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" placeholder="Bridal Lehenga, Groom Suit..." required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="shop-cat">Category</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(val) => {
                        setSelectedCategory(val ?? '')
                        setSelectedSubcategory('')
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
                      value={selectedSubcategory}
                      onValueChange={(val) => val != null && setSelectedSubcategory(val)}
                      disabled={!selectedCategory || subcategoryOptions.length === 0}
                    >
                      <SelectTrigger id="shop-subcat">
                        <SelectValue placeholder="Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategoryOptions.map((sub) => (
                          <SelectItem key={sub.id} value={sub.name}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
                    <Input id="estimated_cost" name="estimated_cost" type="number" step="0.01" placeholder="1000" />
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
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase">Purchased Items</div>
            <div className="text-2xl font-bold">{purchasedCount} / {items.length}</div>
          </div>
          <ShoppingBag className="h-8 w-8 text-purple-500/30" />
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-sky-500">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase">Estimated Budget</div>
            <div className="text-2xl font-bold">${totalEst.toLocaleString()}</div>
          </div>
          <DollarSign className="h-8 w-8 text-sky-500/30" />
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase">Actual Spent</div>
            <div className="text-2xl font-bold">${totalActual.toLocaleString()}</div>
          </div>
          <DollarSign className="h-8 w-8 text-emerald-500/30" />
        </Card>
      </div>

      {/* Shopping Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading shopping items...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="font-semibold">Category & Subcategory</TableHead>
                  <TableHead className="text-right font-semibold">Estimated</TableHead>
                  <TableHead className="text-right font-semibold">Actual Cost</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className={item.is_purchased ? 'bg-muted/20' : ''}>
                    <TableCell>
                      <button
                        onClick={() => handleTogglePurchased(item.id, item.is_purchased)}
                        className="cursor-pointer focus:outline-none"
                      >
                        {item.is_purchased ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className={`font-medium ${item.is_purchased ? 'line-through text-muted-foreground' : ''}`}>
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {item.category}
                        {item.subcategory ? ` > ${item.subcategory}` : ''}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.estimated_cost ? item.estimated_cost.toLocaleString() : '0'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.actual_cost > 0 ? `$${item.actual_cost.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">
                      No shopping items added yet. Click &quot;Add Item&quot; to build your checklist.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
