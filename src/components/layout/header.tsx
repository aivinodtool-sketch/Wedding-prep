'use client'

import { Bell, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { logout } from '@/actions/auth'

export function Header() {
  const { setTheme, theme } = useTheme()

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-zinc-50/40 dark:bg-zinc-950/40 px-6">
      <div className="flex-1" />
      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      <form action={logout}>
        <Button variant="ghost" size="icon" type="submit">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Log out</span>
        </Button>
      </form>
    </header>
  )
}
