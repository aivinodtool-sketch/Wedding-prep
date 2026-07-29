'use client'

import { Plus } from 'lucide-react'
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

const mockGuests = [
  { id: '1', name: 'Alice Smith', rsvp: 'attending', group: 'Bride Family' },
  { id: '2', name: 'Bob Johnson', rsvp: 'pending', group: 'Groom Friends' },
  { id: '3', name: 'Charlie Davis', rsvp: 'declined', group: 'Bride Friends' },
]

export default function GuestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Guest List</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Guest
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>RSVP Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockGuests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>{guest.group}</TableCell>
                <TableCell>
                  <Badge 
                    variant={guest.rsvp === 'attending' ? 'default' : guest.rsvp === 'declined' ? 'destructive' : 'secondary'}
                  >
                    {guest.rsvp}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
