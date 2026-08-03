'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWedding } from '@/contexts/WeddingContext'
import { getVendors, createVendor, deleteVendor, Vendor } from '@/actions/vendors'

export default function VendorsPage() {
  const { activeWedding } = useWedding()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVendors() {
      if (activeWedding) {
        setLoading(true)
        const data = await getVendors(activeWedding.id)
        setVendors(data)
        setLoading(false)
      }
    }
    loadVendors()
  }, [activeWedding])

  async function handleCreateVendor(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    await createVendor(formData)
    setIsDialogOpen(false)
    const updated = await getVendors(activeWedding.id)
    setVendors(updated)
  }

  async function handleDeleteVendor(id: string) {
    if (!activeWedding) return
    await deleteVendor(id)
    const updated = await getVendors(activeWedding.id)
    setVendors(updated)
  }

  if (!activeWedding) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vendors</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <form action={handleCreateVendor} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor / Business Name</Label>
                <Input id="name" name="name" placeholder="Lens Magic Photography" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="Photographer, Caterer, Venue..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_amount">Total Amount ($)</Label>
                  <Input id="total_amount" name="total_amount" type="number" step="0.01" placeholder="3000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advance_paid">Advance Paid ($)</Label>
                  <Input id="advance_paid" name="advance_paid" type="number" step="0.01" placeholder="500" defaultValue="0" />
                </div>
              </div>
              <Button type="submit" className="w-full">Save Vendor</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading vendors...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => {
            const isBooked = vendor.advance_paid > 0
            const balanceDue = vendor.total_amount - vendor.advance_paid
            return (
              <Card key={vendor.id} className="relative group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start pr-6">
                    <div>
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <CardDescription>{vendor.category}</CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      isBooked
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {isBooked ? 'Booked' : 'In Talks'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteVendor(vendor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground pb-2 border-b">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Total Cost</span>
                      <span className="font-medium">${vendor.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Advance Paid</span>
                      <span className="font-medium">${vendor.advance_paid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-muted-foreground">Balance Due</span>
                      <span className={`font-medium ${balanceDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        ${balanceDue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {vendors.length === 0 && (
            <div className="col-span-full text-center py-12 border rounded-lg bg-card text-muted-foreground">
              No vendors added yet. Click &quot;Add Vendor&quot; above to list your venue, photographer, caterer, etc.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
