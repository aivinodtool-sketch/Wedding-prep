'use client'

import { Plus, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const mockShoppingItems = [
  { id: '1', name: 'Bridal Lehenga', category: 'Bride', estimated: 5000, actual: 4800, status: 'purchased' },
  { id: '2', name: 'Groom Sherwani', category: 'Groom', estimated: 2000, actual: 0, status: 'pending' },
  { id: '3', name: 'Return Gifts', category: 'Guests', estimated: 1500, actual: 1600, status: 'purchased' },
]

export default function ShoppingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Shopping List</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Estimated</TableHead>
              <TableHead className="text-right">Actual Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockShoppingItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.status === 'purchased' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right">${item.estimated}</TableCell>
                <TableCell className="text-right">
                  {item.actual > 0 ? `$${item.actual}` : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
