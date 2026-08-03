'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Pencil, Upload, Download, FileText, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWedding } from '@/contexts/WeddingContext'
import { getGuests, createGuest, updateGuest, deleteGuest, bulkCreateGuests, Guest, GuestStatus } from '@/actions/guests'

export default function GuestsPage() {
  const { activeWedding } = useWedding()
  const [guests, setGuests] = useState<Guest[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)

  // Upload file state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [parsedGuests, setParsedGuests] = useState<Array<{ name: string; family_name?: string; phone?: string; status?: GuestStatus; food_preference?: string }>>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    async function loadGuests() {
      if (activeWedding) {
        setLoading(true)
        const data = await getGuests(activeWedding.id)
        setGuests(data)
        setLoading(false)
      }
    }
    loadGuests()
  }, [activeWedding])

  async function handleCreateGuest(formData: FormData) {
    if (!activeWedding) return
    formData.append('wedding_id', activeWedding.id)
    await createGuest(formData)
    setIsAddOpen(false)
    const newGuests = await getGuests(activeWedding.id)
    setGuests(newGuests)
  }

  async function handleUpdateGuest(formData: FormData) {
    if (!editingGuest || !activeWedding) return
    await updateGuest(editingGuest.id, formData)
    setEditingGuest(null)
    const newGuests = await getGuests(activeWedding.id)
    setGuests(newGuests)
  }

  async function handleDeleteGuest(id: string) {
    if (!activeWedding) return
    await deleteGuest(id)
    setGuests((prev) => prev.filter((g) => g.id !== id))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadFile(file)
    setUploadError(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string
        const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
        if (lines.length === 0) {
          setUploadError('File is empty.')
          return
        }

        const items: Array<{ name: string; family_name?: string; phone?: string; status?: GuestStatus; food_preference?: string }> = []

        // Check if line 0 is header
        let startIdx = 0
        const firstLineLower = lines[0].toLowerCase()
        if (firstLineLower.includes('name') || firstLineLower.includes('group') || firstLineLower.includes('phone')) {
          startIdx = 1
        }

        for (let i = startIdx; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim())
          if (!parts[0]) continue

          const name = parts[0]
          const family_name = parts[1] || ''
          const phone = parts[2] || ''
          const rawStatus = (parts[3] || '').toLowerCase()
          let status: GuestStatus = 'not_invited'
          if (rawStatus.includes('attend')) status = 'attending'
          else if (rawStatus.includes('decline')) status = 'declined'
          else if (rawStatus.includes('invite')) status = 'invited'

          const food_preference = parts[4] || ''

          items.push({ name, family_name, phone, status, food_preference })
        }

        if (items.length === 0) {
          setUploadError('No valid guest names found in file.')
        } else {
          setParsedGuests(items)
        }
      } catch (err: any) {
        setUploadError(err?.message || 'Failed to parse file.')
      }
    }
    reader.readAsText(file)
  }

  async function handleConfirmBulkImport() {
    if (!activeWedding || parsedGuests.length === 0) return
    await bulkCreateGuests(activeWedding.id, parsedGuests)
    setIsUploadOpen(false)
    setUploadFile(null)
    setParsedGuests([])
    const newGuests = await getGuests(activeWedding.id)
    setGuests(newGuests)
  }

  function downloadSampleCSV() {
    const csvContent = `Name, Group / Family, Phone, RSVP Status, Food Preference\nJohn Doe, Bride's Family, +15550123, Attending, Vegetarian\nJane Smith, Groom's Friends, +15550199, Invited, Non-Veg`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'guests_sample.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!activeWedding) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Guest List</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage invitations, RSVPs, dietary preferences, and guest details
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload / Import CSV Dialog */}
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger render={
              <Button variant="outline" size="sm" className="h-9">
                <Upload className="mr-1.5 h-4 w-4" />
                Import File
              </Button>
            } />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Import Guests from CSV / Text File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-xs text-muted-foreground">
                  Upload a CSV file containing guest names and details.
                </p>

                <div className="flex items-center justify-between gap-2 p-3 bg-muted/40 rounded-lg border">
                  <span className="text-xs text-muted-foreground">Need a starting template?</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={downloadSampleCSV}>
                    <Download className="mr-1 h-3.5 w-3.5" />
                    Sample CSV
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guest-file">Select File (.csv or .txt)</Label>
                  <Input
                    id="guest-file"
                    type="file"
                    accept=".csv,.txt"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>

                {uploadError && (
                  <p className="text-xs font-medium text-destructive">{uploadError}</p>
                )}

                {parsedGuests.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Parsed {parsedGuests.length} guests ready to import:
                    </p>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-zinc-50 dark:bg-zinc-900 space-y-1 text-xs">
                      {parsedGuests.slice(0, 10).map((g, idx) => (
                        <div key={idx} className="flex justify-between border-b pb-1 last:border-0">
                          <span className="font-medium">{g.name}</span>
                          <span className="text-muted-foreground">{g.family_name || 'No group'} • {g.status}</span>
                        </div>
                      ))}
                      {parsedGuests.length > 10 && (
                        <p className="text-muted-foreground text-center pt-1 italic">
                          ...and {parsedGuests.length - 10} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                  <Button onClick={handleConfirmBulkImport} disabled={parsedGuests.length === 0}>
                    Import {parsedGuests.length > 0 ? `${parsedGuests.length} Guests` : ''}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Guest Modal */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button size="sm" className="h-9">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Guest
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Guest</DialogTitle>
              </DialogHeader>
              <form action={handleCreateGuest} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Guest Name</Label>
                  <Input id="name" name="name" placeholder="John Doe" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="family_name">Group / Family</Label>
                    <Input id="family_name" name="family_name" placeholder="Bride's Family" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="status">RSVP Status</Label>
                    <Select name="status" defaultValue="not_invited">
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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
                    <Input id="food_preference" name="food_preference" placeholder="Veg / Non-Veg / Vegan" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes / Special Requests</Label>
                  <Input id="notes" name="notes" placeholder="Plus one, wheelchair access..." />
                </div>
                <Button type="submit" className="w-full">Save Guest</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Guest Dialog */}
      {editingGuest && (
        <Dialog open={!!editingGuest} onOpenChange={(open) => !open && setEditingGuest(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Guest Details</DialogTitle>
            </DialogHeader>
            <form action={handleUpdateGuest} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Guest Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingGuest.name} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-family_name">Group / Family</Label>
                  <Input id="edit-family_name" name="family_name" defaultValue={editingGuest.family_name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input id="edit-phone" name="phone" defaultValue={editingGuest.phone || ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">RSVP Status</Label>
                  <Select name="status" defaultValue={editingGuest.status}>
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
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
                  <Label htmlFor="edit-food_preference">Food Preference</Label>
                  <Input id="edit-food_preference" name="food_preference" defaultValue={editingGuest.food_preference || ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-table_number">Table Number</Label>
                  <Input id="edit-table_number" name="table_number" type="number" defaultValue={editingGuest.table_number || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-gift_received">Gift Received</Label>
                  <Input id="edit-gift_received" name="gift_received" defaultValue={editingGuest.gift_received || ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input id="edit-notes" name="notes" defaultValue={editingGuest.notes || ''} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingGuest(null)}>Cancel</Button>
                <Button type="submit">Update Guest</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Guest Table */}
      <div className="rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading guests...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                <TableRow>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Group / Family</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">RSVP Status</TableHead>
                  <TableHead className="font-semibold">Food Pref</TableHead>
                  <TableHead className="w-20 text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell className="text-muted-foreground">{guest.family_name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{guest.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          guest.status === 'attending'
                            ? 'default'
                            : guest.status === 'declined'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={
                          guest.status === 'attending'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                            : guest.status === 'declined'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200'
                            : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                        }
                      >
                        {guest.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{guest.food_preference || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setEditingGuest(guest)}
                          title="Edit guest"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteGuest(guest.id)}
                          title="Delete guest"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {guests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No guests found. Click &quot;Add Guest&quot; or &quot;Import File&quot; to build your guest list.
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
