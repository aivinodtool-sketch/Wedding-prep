'use client'

import { ReactNode, useState, useEffect } from 'react'
import { WeddingProvider, Wedding, useWedding } from '@/contexts/WeddingContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWedding } from '@/actions/weddings'
import { useRouter } from 'next/navigation'

export function WeddingGuard({ 
  children,
  initialWeddings 
}: { 
  children: ReactNode,
  initialWeddings: Wedding[]
}) {
  return (
    <WeddingProvider initialWeddings={initialWeddings}>
      <WeddingGuardInner>{children}</WeddingGuardInner>
    </WeddingProvider>
  )
}

function WeddingGuardInner({ children }: { children: ReactNode }) {
  const { weddings, setWeddings, setActiveWedding } = useWedding()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const isOpen = weddings.length === 0 || internalIsOpen

  async function onSubmit(formData: FormData) {
    setLoading(true)
    try {
      const newWedding = await createWedding(formData)
      setWeddings([newWedding])
      setActiveWedding(newWedding)
      setInternalIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Failed to create wedding")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {weddings.length > 0 && children}
      
      <Dialog open={isOpen} onOpenChange={(open) => {
        // Force open if no weddings exist
        if (weddings.length === 0) setInternalIsOpen(true)
        else setInternalIsOpen(open)
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create your Wedding</DialogTitle>
            <DialogDescription>
              Let&apos;s set up your wedding space first.
            </DialogDescription>
          </DialogHeader>
          <form action={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Wedding Name</Label>
              <Input id="name" name="name" placeholder="John & Jane's Wedding" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Wedding Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Wedding'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
