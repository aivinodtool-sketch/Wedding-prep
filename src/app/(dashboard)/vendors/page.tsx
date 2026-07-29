'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const mockVendors = [
  { id: '1', name: 'Lens Magic', category: 'Photographer', status: 'Booked', total: 3000, paid: 1500 },
  { id: '2', name: 'Floral Dreams', category: 'Decorator', status: 'In Talks', total: 2000, paid: 0 },
  { id: '3', name: 'Grand Palace', category: 'Venue', status: 'Booked', total: 10000, paid: 5000 },
]

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockVendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{vendor.name}</CardTitle>
                  <CardDescription>{vendor.category}</CardDescription>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  vendor.status === 'Booked' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {vendor.status}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-medium">${vendor.total}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Advance Paid</span>
                  <span className="font-medium">${vendor.paid}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">Balance Due</span>
                  <span className="font-medium text-destructive">${vendor.total - vendor.paid}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4">View Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
