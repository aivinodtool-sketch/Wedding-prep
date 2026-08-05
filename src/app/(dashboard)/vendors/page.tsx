'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Phone, FolderTree, Store, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWedding } from '@/contexts/WeddingContext'
import { getVendors, createVendor, deleteVendor, Vendor } from '@/actions/vendors'
import { getCategories, Category } from '@/actions/categories'
import { CategoryManager } from '@/components/modules/category-manager'

export default function VendorsPage() {
  const { activeWedding } = useWedding()

  const [vendors, setVendors] = useState<Vendor[]>([])
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
    const [v, c] = await Promise.all([
      getVendors(activeWedding.id),
      getCategories(activeWedding.id),
    ])
    setVendors(v)
    setCategories(c)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [activeWedding])

  async function handleCreateVendor(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    if (selectedCategory) formData.append('category', selectedCategory)
    if (selectedSubcategory) formData.append('subcategory', selectedSubcategory)

    await createVendor(formData)
    setIsDialogOpen(false)
    setSelectedCategory('')
    setSelectedSubcategory('')
    await loadData()
  }

  async function handleDeleteVendor(id: string) {
    if (!activeWedding) return
    await deleteVendor(id)
    await loadData()
  }

  const subcategoryOptions =
    categories.find((c) => c.name === selectedCategory)?.children || []

  // Total finances
  const totalAmount = vendors.reduce((acc, v) => acc + (v.total_amount || 0), 0)
  const totalAdvance = vendors.reduce((acc, v) => acc + (v.advance_paid || 0), 0)
  const totalBalance = totalAmount - totalAdvance

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Vendors & Partners</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage vendor contracts, advance payments, and categories
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
                Add Vendor
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <form action={handleCreateVendor} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor / Business Name</Label>
                  <Input id="name" name="name" placeholder="Lens Magic Photography" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="vendor-cat">Category</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(val) => {
                        setSelectedCategory(val ?? '')
                        setSelectedSubcategory('')
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
                      value={selectedSubcategory}
                      onValueChange={(val) => val != null && setSelectedSubcategory(val)}
                      disabled={!selectedCategory || subcategoryOptions.length === 0}
                    >
                      <SelectTrigger id="vendor-subcat">
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
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-sky-500">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase">Total Vendors Contracted</div>
            <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
          </div>
          <Store className="h-8 w-8 text-sky-500/30" />
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase">Total Advance Paid</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${totalAdvance.toLocaleString()}
            </div>
          </div>
          <DollarSign className="h-8 w-8 text-emerald-500/30" />
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase">Pending Balance</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              ${totalBalance.toLocaleString()}
            </div>
          </div>
          <DollarSign className="h-8 w-8 text-amber-500/30" />
        </Card>
      </div>

      {/* Vendors Cards List */}
      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Loading vendors...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => {
            const isBooked = vendor.advance_paid > 0
            const balanceDue = vendor.total_amount - vendor.advance_paid

            return (
              <Card key={vendor.id} className="relative group hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start pr-6">
                    <div>
                      <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {vendor.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="outline" className="text-xs font-normal">
                          {vendor.category}
                          {vendor.subcategory ? ` > ${vendor.subcategory}` : ''}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        isBooked
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200'
                      }
                    >
                      {isBooked ? 'Booked' : 'In Talks'}
                    </Badge>
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
                  <div className="space-y-2.5 text-sm">
                    {vendor.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground pb-2 border-b text-xs">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="font-semibold">${vendor.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Advance Paid</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ${vendor.advance_paid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-muted-foreground">Balance Due</span>
                      <span className={`font-bold ${balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
                        ${balanceDue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {vendors.length === 0 && (
            <div className="col-span-full text-center py-12 border rounded-lg bg-card text-muted-foreground text-xs">
              No vendors added yet. Click &quot;Add Vendor&quot; above to list venue, photographer, caterer, etc.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
