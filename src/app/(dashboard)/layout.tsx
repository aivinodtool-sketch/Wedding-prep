import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { getUserWeddings } from '@/actions/weddings'
import { WeddingGuard } from '@/components/layout/wedding-guard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const initialWeddings = await getUserWeddings()

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-900/50 p-4 sm:p-6">
          <WeddingGuard initialWeddings={initialWeddings}>
            {children}
          </WeddingGuard>
        </main>
      </div>
    </div>
  )
}
