'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Users, Calendar } from 'lucide-react'
import { useWedding } from '@/contexts/WeddingContext'
import { getTasks, Task } from '@/actions/tasks'
import { getGuests, Guest } from '@/actions/guests'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { activeWedding } = useWedding()
  const [tasks, setTasks] = useState<Task[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      if (activeWedding) {
        setLoading(true)
        const [t, g] = await Promise.all([
          getTasks(activeWedding.id),
          getGuests(activeWedding.id),
        ])
        setTasks(t)
        setGuests(g)
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [activeWedding])

  if (!activeWedding) return null

  // Calculate days remaining
  const weddingDate = new Date(activeWedding.date)
  const today = new Date()
  const diffTime = weddingDate.getTime() - today.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  // Calculate task stats
  const pendingTasks = tasks.filter((t) => t.status !== 'completed')

  // Calculate guest stats
  const totalGuests = guests.length
  const attendingGuests = guests.filter((g) => g.status === 'attending').length
  const rsvpResponseCount = guests.filter((g) => g.status === 'attending' || g.status === 'declined').length
  const responseRate = totalGuests > 0 ? Math.round((rsvpResponseCount / totalGuests) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{activeWedding.name} Dashboard</h1>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days to Wedding</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysRemaining}</div>
            <p className="text-xs text-muted-foreground">
              {weddingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter((t) => t.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest RSVPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendingGuests} Attending</div>
            <p className="text-xs text-muted-foreground">
              {responseRate}% response rate ({totalGuests} total)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            ) : pendingTasks.length > 0 ? (
              <div className="space-y-4">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-4 border-b pb-3 last:border-0">
                    <div className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0",
                      task.status === 'in_progress' ? 'bg-sky-500' : 'bg-amber-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        Priority: {task.priority} {task.description ? `• ${task.description}` : ''}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded font-medium capitalize shrink-0",
                      task.status === 'in_progress'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    )}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No pending tasks. Great job!</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Guests Invited</span>
                <span className="font-medium">{totalGuests}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Tasks Pending</span>
                <span className="font-medium">{pendingTasks.length}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Tasks Completed</span>
                <span className="font-medium">{tasks.filter((t) => t.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Days Remaining</span>
                <span className="font-medium text-primary">{daysRemaining} days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

