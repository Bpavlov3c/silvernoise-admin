'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Users, Tag, Disc3, FileText, CreditCard,
  Mail, Newspaper, Settings, Activity, RefreshCw, ChevronRight,
  Menu, X, LogOut, User, ChevronDown,
} from 'lucide-react'
import { logout, getStoredUser } from '@/lib/auth'

const NAV = [
  { href: '/dashboard',       label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/customers',       label: 'Customers',      icon: Users },
  { href: '/labels',          label: 'Labels',         icon: Tag },
  { href: '/releases',        label: 'Releases',       icon: Disc3 },
  { href: '/reports',         label: 'Reports',        icon: FileText },
  { href: '/payments',        label: 'Payments',       icon: CreditCard },
  null,
  { href: '/email-templates', label: 'Email Templates', icon: Mail },
  { href: '/newsletters',     label: 'Newsletters',    icon: Newspaper },
  { href: '/smtp',            label: 'SMTP Settings',  icon: Settings },
  { href: '/email-log',       label: 'Email Log',      icon: Activity },
  { href: '/api-logs',        label: 'API Logs / KVZ', icon: RefreshCw },
] as const

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const user = getStoredUser()

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  async function handleLogout() {
    await logout()
    router.replace('/login')
  }

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV.map((item, i) => {
        if (item === null) {
          return <div key={i} className="my-2 mx-2 border-t border-sn-border" />
        }
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
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

  return (
    <div className="min-h-screen bg-sn-black flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-sn-dark border-r border-sn-border z-30">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-sn-border flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-sn-cyan to-sn-purple flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M2 8 L5 4 L8 10 L11 6 L14 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="leading-none min-w-0">
              <div className="font-display font-bold text-sm text-sn-white tracking-wide truncate">SILVERNOISE</div>
              <div className="text-[9px] text-sn-muted tracking-widest uppercase mt-0.5">Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <NavItems />
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sn-border flex-shrink-0">
          <div className="text-[10px] text-sn-muted text-center tracking-wider">
            INTERNAL · RESTRICTED ACCESS
          </div>
        </div>
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
        <div className="h-14 flex items-center justify-between px-4 border-b border-sn-border flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-sn-cyan to-sn-purple flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M2 8 L5 4 L8 10 L11 6 L14 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="leading-none min-w-0">
              <div className="font-display font-bold text-sm text-sn-white tracking-wide">SILVERNOISE</div>
              <div className="text-[9px] text-sn-muted tracking-widest uppercase mt-0.5">Admin</div>
            </div>
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

        {/* Logout in drawer */}
        <div className="p-3 border-t border-sn-border flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-sn-muted hover:text-sn-red hover:bg-sn-red/10 transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
          <div className="text-[10px] text-sn-muted text-center tracking-wider mt-2">
            INTERNAL · RESTRICTED ACCESS
          </div>
        </div>
      </div>

      {/* ── Top Bar ── */}
      <header className="fixed top-0 left-0 lg:left-56 right-0 h-14 bg-sn-dark/90 backdrop-blur border-b border-sn-border z-20 flex items-center px-4 lg:px-6 justify-between gap-4">
        {/* Mobile: hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-sn-muted hover:text-sn-white p-1 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile: logo text */}
        <div className="lg:hidden flex-1 min-w-0">
          <p className="text-xs font-semibold text-sn-white font-display truncate">Admin Central</p>
        </div>

        {/* Desktop: spacer */}
        <div className="hidden lg:block flex-1" />

        {/* User menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 text-sm text-sn-white hover:text-sn-cyan transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sn-cyan/30 to-sn-purple/30 border border-sn-border flex items-center justify-center flex-shrink-0">
              <User size={13} />
            </div>
            <span className="hidden sm:block font-medium truncate max-w-[120px]">
              {user ? `${user.name} ${user.surname}` : 'Admin'}
            </span>
            <ChevronDown size={13} className="text-sn-muted" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
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

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-56 pt-14 min-h-screen bg-sn-black min-w-0">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
