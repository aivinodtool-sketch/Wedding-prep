'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWedding } from '@/contexts/WeddingContext'
import { getBudgets, createBudget, deleteBudget, BudgetItem } from '@/actions/budget'

export default function BudgetPage() {
  const { activeWedding } = useWedding()
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBudgets() {
      if (activeWedding) {
        setLoading(true)
        const data = await getBudgets(activeWedding.id)
        setBudgets(data)
        setLoading(false)
      }
    }
    loadBudgets()
  }, [activeWedding])

  async function handleCreateBudget(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    await createBudget(formData)
    setIsDialogOpen(false)
    const updated = await getBudgets(activeWedding.id)
    setBudgets(updated)
  }

  async function handleDeleteBudget(id: string) {
    if (!activeWedding) return
    await deleteBudget(id)
    const updated = await getBudgets(activeWedding.id)
    setBudgets(updated)
  }

  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated_amount, 0)
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0)
  const percentSpent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0

  if (!activeWedding) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Budget Overview</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget Category
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Budget Category</DialogTitle>
            </DialogHeader>
            <form action={handleCreateBudget} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category Name</Label>
                <Input id="category" name="category" placeholder="Venue & Catering" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocated_amount">Allocated Amount ($)</Label>
                <Input id="allocated_amount" name="allocated_amount" type="number" step="0.01" placeholder="5000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spent_amount">Amount Spent ($)</Label>
                <Input id="spent_amount" name="spent_amount" type="number" step="0.01" placeholder="0" defaultValue="0" />
              </div>
              <Button type="submit" className="w-full">Save Category</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Total Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-2xl font-bold">
              <span>Spent: ${totalSpent.toLocaleString()}</span>
              <span>Remaining: ${(totalAllocated - totalSpent).toLocaleString()}</span>
            </div>
            <Progress value={Math.min(percentSpent, 100)} className="h-4 bg-primary-foreground/20" />
            <div className="text-sm opacity-80">
              {percentSpent.toFixed(1)}% of total allocated budget (${totalAllocated.toLocaleString()})
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading budget...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const itemPercent = budget.allocated_amount > 0 ? (budget.spent_amount / budget.allocated_amount) * 100 : 0
            return (
              <Card key={budget.id} className="relative group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex justify-between items-center pr-8">
                    <span>{budget.category}</span>
                    <span className="text-muted-foreground text-sm font-normal">
                      ${budget.spent_amount.toLocaleString()} / ${budget.allocated_amount.toLocaleString()}
                    </span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteBudget(budget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <Progress value={Math.min(itemPercent, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    ${(budget.allocated_amount - budget.spent_amount).toLocaleString()} remaining
                  </p>
                </CardContent>
              </Card>
            )
          })}
          {budgets.length === 0 && (
            <div className="col-span-2 text-center py-12 border rounded-lg bg-card text-muted-foreground">
              No budget categories created yet. Click &quot;Add Budget Category&quot; above to get started.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
