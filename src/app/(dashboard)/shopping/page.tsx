'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useWedding } from '@/contexts/WeddingContext'
import {
  getShoppingItems,
  createShoppingItem,
  toggleItemPurchased,
  deleteShoppingItem,
  ShoppingItem,
} from '@/actions/shopping'

export default function ShoppingPage() {
  const { activeWedding } = useWedding()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadItems() {
      if (activeWedding) {
        setLoading(true)
        const data = await getShoppingItems(activeWedding.id)
        setItems(data)
        setLoading(false)
      }
    }
    loadItems()
  }, [activeWedding])

  async function handleCreateItem(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    await createShoppingItem(formData)
    setIsDialogOpen(false)
    const updated = await getShoppingItems(activeWedding.id)
    setItems(updated)
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

  if (!activeWedding) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Shopping List</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Shopping Item</DialogTitle>
            </DialogHeader>
            <form action={handleCreateItem} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" name="name" placeholder="Bridal Wear, Gift Box..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="Bride, Groom, Guests, Decor..." required />
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

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading shopping items...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right">Actual Cost</TableHead>
                <TableHead className="w-12 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={item.is_purchased ? 'bg-muted/30' : ''}>
                  <TableCell>
                    <button
                      onClick={() => handleTogglePurchased(item.id, item.is_purchased)}
                      className="cursor-pointer focus:outline-none"
                    >
                      {item.is_purchased ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className={`font-medium ${item.is_purchased ? 'line-through text-muted-foreground' : ''}`}>
                    {item.name}
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">
                    ${item.estimated_cost ? item.estimated_cost.toLocaleString() : '0'}
                  </TableCell>
                  <TableCell className="text-right">
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No shopping items added yet. Click &quot;Add Item&quot; to build your checklist.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
