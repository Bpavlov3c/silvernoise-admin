'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { logout, getStoredUser } from '@/lib/auth'

export function TopBar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const user = getStoredUser()

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  return (
    <header className="fixed top-0 left-56 right-0 h-14 bg-sn-dark/80 backdrop-blur border-b border-sn-border z-20 flex items-center px-6 justify-between">
      {/* Left — breadcrumb will be set per page, TopBar just provides the shell */}
      <div />

      {/* Right — user menu */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm text-sn-white hover:text-sn-cyan transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sn-cyan/30 to-sn-purple/30 border border-sn-border flex items-center justify-center">
            <User size={13} />
          </div>
          <span className="hidden sm:block font-medium">
            {user ? `${user.name} ${user.surname}` : 'Admin'}
          </span>
          <ChevronDown size={13} className="text-sn-muted" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-44 sn-card shadow-xl z-20 py-1">
              {user && (
                <div className="px-3 py-2 border-b border-sn-border">
                  <p className="text-xs text-sn-muted truncate">{user.email}</p>
                  <p className="text-[10px] text-sn-purple uppercase tracking-wider mt-0.5">{user.role}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sn-muted hover:text-sn-red hover:bg-sn-red/5 transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
