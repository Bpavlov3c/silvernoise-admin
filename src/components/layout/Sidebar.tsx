'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Users,
  Tag,
  Disc3,
  FileText,
  CreditCard,
  Mail,
  Newspaper,
  Settings,
  Activity,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/labels', label: 'Labels', icon: Tag },
  { href: '/releases', label: 'Releases', icon: Disc3 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  null, // divider
  { href: '/email-templates', label: 'Email Templates', icon: Mail },
  { href: '/newsletters', label: 'Newsletters', icon: Newspaper },
  { href: '/smtp', label: 'SMTP Settings', icon: Settings },
  { href: '/email-log', label: 'Email Log', icon: Activity },
  { href: '/api-logs', label: 'API Logs / KVZ', icon: RefreshCw },
] as const

export function Sidebar() {
  const path = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-sn-dark border-r border-sn-border flex flex-col z-30">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sn-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-sn-cyan to-sn-purple flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M2 8 L5 4 L8 10 L11 6 L14 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="font-display font-bold text-sm text-sn-white tracking-wide">SILVERNOISE</div>
            <div className="text-[9px] text-sn-muted tracking-widest uppercase mt-0.5">Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map((item, i) => {
          if (item === null) {
            return <div key={i} className="my-2 mx-2 border-t border-sn-border" />
          }

          const active = path === item.href || path.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group',
                active
                  ? 'bg-sn-cyan/10 text-sn-cyan border border-sn-cyan/20'
                  : 'text-sn-muted hover:text-sn-white hover:bg-sn-surface'
              )}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={12} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sn-border">
        <div className="text-[10px] text-sn-muted text-center tracking-wider">
          INTERNAL · RESTRICTED ACCESS
        </div>
      </div>
    </aside>
  )
}
