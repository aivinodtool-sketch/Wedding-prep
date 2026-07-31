'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Wedding } from '@/actions/weddings'

export type { Wedding }

type WeddingContextType = {
  activeWedding: Wedding | null
  setActiveWedding: (wedding: Wedding) => void
  weddings: Wedding[]
  setWeddings: (weddings: Wedding[]) => void
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined)

export function WeddingProvider({ 
  children,
  initialWeddings = []
}: { 
  children: ReactNode,
  initialWeddings?: Wedding[]
}) {
  const [weddings, setWeddings] = useState<Wedding[]>(initialWeddings)
  const [activeWeddingState, setActiveWeddingState] = useState<Wedding | null>(null)

  // Derive activeWedding: if explicitly set, use it. Otherwise, fallback to the first wedding if available.
  const activeWedding = activeWeddingState || (weddings.length > 0 ? weddings[0] : null)

  const setActiveWedding = (wedding: Wedding) => {
    setActiveWeddingState(wedding)
  }

  return (
    <WeddingContext.Provider value={{ activeWedding, setActiveWedding, weddings, setWeddings }}>
      {children}
    </WeddingContext.Provider>
  )
}

export function useWedding() {
  const context = useContext(WeddingContext)
  if (context === undefined) {
    throw new Error('useWedding must be used within a WeddingProvider')
  }
  return context
}
