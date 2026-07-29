'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Store, 
  ShoppingCart, 
  Calculator,
  FileText
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Guests', href: '/guests', icon: Users },
  { name: 'Vendors', href: '/vendors', icon: Store },
  { name: 'Shopping', href: '/shopping', icon: ShoppingCart },
  { name: 'Budget', href: '/budget', icon: Calculator },
  { name: 'Documents', href: '/documents', icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-zinc-50/40 dark:bg-zinc-950/40 px-3 py-4">
      <div className="mb-8 px-4 text-lg font-semibold tracking-tight">
        Wedding Planner
      </div>
      <div className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:text-primary',
                isActive
                  ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                  : 'text-zinc-500 hover:bg-zinc-100/50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
