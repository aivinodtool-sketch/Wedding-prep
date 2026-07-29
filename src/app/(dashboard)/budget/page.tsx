'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const mockBudgets = [
  { id: '1', category: 'Venue & Catering', allocated: 15000, spent: 10000 },
  { id: '2', category: 'Attire', allocated: 5000, spent: 4800 },
  { id: '3', category: 'Photography', allocated: 3500, spent: 1500 },
  { id: '4', category: 'Decorations', allocated: 3000, spent: 500 },
]

export default function BudgetPage() {
  const totalAllocated = mockBudgets.reduce((acc, b) => acc + b.allocated, 0)
  const totalSpent = mockBudgets.reduce((acc, b) => acc + b.spent, 0)
  const percentSpent = (totalSpent / totalAllocated) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Budget Overview</h1>
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Total Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-2xl font-bold">
              <span>Spent: ${totalSpent}</span>
              <span>Remaining: ${totalAllocated - totalSpent}</span>
            </div>
            <Progress value={percentSpent} className="h-4 bg-primary-foreground/20" />
            <div className="text-sm opacity-80">
              {percentSpent.toFixed(1)}% of total allocated budget (${totalAllocated})
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {mockBudgets.map((budget) => (
          <Card key={budget.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between">
                <span>{budget.category}</span>
                <span className="text-muted-foreground">${budget.spent} / ${budget.allocated}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(budget.spent / budget.allocated) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                ${budget.allocated - budget.spent} remaining
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
