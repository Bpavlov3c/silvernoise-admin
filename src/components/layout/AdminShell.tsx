'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Users, Tag, Disc3, FileText, CreditCard,
  Mail, Newspaper, Activity, RefreshCw, ChevronRight,
  Menu, X, LogOut,
} from 'lucide-react'
import { logout, getStoredUser } from '@/lib/auth'

const NAV = [
  { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/customers',       label: 'Customers',       icon: Users },
  { href: '/labels',          label: 'Labels',          icon: Tag },
  { href: '/releases',        label: 'Releases',        icon: Disc3 },
  { href: '/reports',         label: 'Reports',         icon: FileText },
  { href: '/payments',        label: 'Payments',        icon: CreditCard },
  null,
  { href: '/email-templates', label: 'Email Templates', icon: Mail },
  { href: '/newsletters',     label: 'Newsletters',     icon: Newspaper },
  { href: '/email-log',       label: 'Email Log',       icon: Activity },
  { href: '/api-logs',        label: 'API Logs / KVZ',  icon: RefreshCw },
] as const

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = getStoredUser()

  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  const displayName = user ? `${user.name} ${user.surname}` : 'Admin'
  const initials    = user ? (user.name[0] + user.surname[0]).toUpperCase() : 'A'

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV.map((item, i) => {
        if (item === null) {
          return <div key={i} className="my-2 mx-2 border-t border-sn-border" />
        }
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon   = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
              active
                ? 'bg-sn-cyan/10 text-sn-cyan border border-sn-cyan/20'
                : 'text-sn-muted hover:text-sn-white hover:bg-sn-surface'
            )}
          >
            <Icon size={15} className="flex-shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {active && <ChevronRight size={12} className="opacity-60 flex-shrink-0" />}
          </Link>
        )
      })}
    </>
  )

  const UserFooter = () => (
    <div className="px-3 py-4 border-t border-sn-border space-y-1 flex-shrink-0">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sn-cyan/30 to-sn-purple/30 border border-sn-border flex items-center justify-center text-xs font-bold text-sn-white flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-sn-white truncate">{displayName}</p>
          <p className="text-xs text-sn-muted truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sn-muted hover:text-sn-red hover:bg-sn-red/10 transition-all"
      >
        <LogOut size={15} /> Sign out
      </button>
      <div className="text-[10px] text-sn-muted text-center tracking-wider pt-1">
        INTERNAL · RESTRICTED ACCESS
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-sn-black flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-sn-dark border-r border-sn-border z-30">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center py-4 px-4 border-b border-sn-border flex-shrink-0 gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Silvernoise" className="h-10 w-auto object-contain" />
          <div className="text-[9px] text-sn-muted tracking-widest uppercase">Admin Central</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <NavItems />
        </nav>

        {/* User + logout at bottom */}
        <UserFooter />
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar drawer ── */}
      <div className={clsx(
        'lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sn-dark border-r border-sn-border flex flex-col transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sn-border flex-shrink-0">
          <div className="flex flex-col items-start gap-0.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Silvernoise" className="h-8 w-auto object-contain" />
            <div className="text-[9px] text-sn-muted tracking-widest uppercase">Admin Central</div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-sn-muted hover:text-sn-white p-1 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <NavItems onClick={() => setMobileOpen(false)} />
        </nav>

        {/* User + logout at bottom of drawer */}
        <UserFooter />
      </div>

      {/* ── Mobile Top Bar (hamburger only) ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sn-dark/90 backdrop-blur border-b border-sn-border z-20 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-sn-muted hover:text-sn-white p-1 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Silvernoise" className="h-7 w-auto object-contain" />
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 min-h-screen bg-sn-black min-w-0">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
