'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
import { getGuests, createGuest, deleteGuest, Guest } from '@/actions/guests'

export default function GuestsPage() {
  const { activeWedding } = useWedding()
  const [guests, setGuests] = useState<Guest[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

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
    setIsDialogOpen(false)
    const newGuests = await getGuests(activeWedding.id)
    setGuests(newGuests)
  }

  async function handleDeleteGuest(id: string) {
    if (!activeWedding) return
    await deleteGuest(id)
    setGuests((prev) => prev.filter((g) => g.id !== id))
  }

  if (!activeWedding) return null

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Guest List</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Guest
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Guest</DialogTitle>
            </DialogHeader>
            <form action={handleCreateGuest} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Guest Name</Label>
                <Input id="name" name="name" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="family_name">Group / Family Name</Label>
                <Input id="family_name" name="family_name" placeholder="Bride's Family" />
              </div>
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
              <Button type="submit" className="w-full">Save Guest</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950 flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading guests...</div>
        ) : (
          <div className="overflow-auto flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>RSVP Status</TableHead>
                  <TableHead className="w-12 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>{guest.family_name || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={guest.status === 'attending' ? 'default' : guest.status === 'declined' ? 'destructive' : 'secondary'}
                      >
                        {guest.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteGuest(guest.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {guests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No guests found. Click &quot;Add Guest&quot; to start building your list.
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
