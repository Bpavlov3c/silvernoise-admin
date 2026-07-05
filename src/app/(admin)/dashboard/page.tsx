'use client'

import { useEffect, useState } from 'react'
import { dashboard, type DashboardData } from '@/lib/api'
import {
  Users, Disc3, FileText, CreditCard,
  TrendingUp, AlertTriangle, Loader2, Tag, Music,
} from 'lucide-react'
import { clsx } from 'clsx'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'cyan',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: 'cyan' | 'purple' | 'gold' | 'green' | 'red'
}) {
  const colours = {
    cyan:   'text-sn-cyan bg-sn-cyan/10',
    purple: 'text-sn-violet bg-sn-violet/10',
    gold:   'text-sn-gold bg-sn-gold/10',
    green:  'text-sn-green bg-sn-green/10',
    red:    'text-sn-red bg-sn-red/10',
  }

  return (
    <div className="sn-card p-5 flex items-start gap-4">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colours[accent])}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-sn-muted uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold font-display text-sn-white">{value}</p>
        {sub && <p className="text-xs text-sn-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  live:      'bg-sn-green/10 text-sn-green border border-sn-green/20',
  pending:   'bg-sn-gold/10 text-sn-gold border border-sn-gold/20',
  approved:  'bg-sn-cyan/10 text-sn-cyan border border-sn-cyan/20',
  delivered: 'bg-sn-violet/10 text-sn-violet border border-sn-violet/20',
  draft:     'bg-sn-muted/10 text-sn-muted border border-sn-border',
  takedown:  'bg-sn-red/10 text-sn-red border border-sn-red/20',
}

function fmt(n: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboard.get()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-sn-cyan" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-xl p-4">
        <AlertTriangle size={16} />
        {error}
      </div>
    )
  }

  const s = data!.stats

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white">Dashboard</h1>
        <p className="text-sm text-sn-muted mt-1">Silvernoise platform overview</p>
      </div>

      {/* Row 1: business metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatCard label="Total Customers" value={s.total_customers} sub={`${s.active_customers} active`} icon={Users} accent="cyan" />
        <StatCard label="Unpaid Reports" value={s.unpaid_reports} sub={fmt(s.pending_earnings_eur)} icon={FileText} accent={s.unpaid_reports > 0 ? 'gold' : 'green'} />
        <StatCard label="Pending Payments" value={s.pending_payments} sub={fmt(s.total_earnings_eur) + ' total paid'} icon={CreditCard} accent={s.pending_payments > 0 ? 'red' : 'green'} />
      </div>

      {/* Row 2: catalog counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Labels" value={s.total_labels} icon={Tag} accent="purple" />
        <StatCard label="Total Releases" value={s.total_releases} sub={`${s.live_releases} live · ${s.pending_releases} pending`} icon={Disc3} accent="cyan" />
        <StatCard label="Total Tracks" value={s.total_tracks} icon={Music} accent="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Releases */}
        <div className="sn-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-sn-border">
            <div className="flex items-center gap-2 text-sm font-medium text-sn-white">
              <Disc3 size={15} className="text-sn-purple" />
              Recent Releases
            </div>
            <a href="/releases" className="text-xs text-sn-cyan hover:underline">View all</a>
          </div>
          <div className="divide-y divide-sn-border">
            {data!.recent_releases.length === 0 && (
              <p className="px-5 py-4 text-sm text-sn-muted">No releases yet</p>
            )}
            {data!.recent_releases.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-sn-surface border border-sn-border flex items-center justify-center flex-shrink-0">
                  <Disc3 size={13} className="text-sn-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sn-white truncate">{r.title}</p>
                  <p className="text-xs text-sn-muted truncate">{r.label?.name ?? '—'}</p>
                </div>
                <span className={clsx('status-badge', STATUS_STYLES[r.status] ?? STATUS_STYLES.draft)}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Queue */}
        <div className="sn-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-sn-border">
            <div className="flex items-center gap-2 text-sm font-medium text-sn-white">
              <CreditCard size={15} className="text-sn-gold" />
              Payment Queue
            </div>
            <a href="/payments" className="text-xs text-sn-cyan hover:underline">View all</a>
          </div>
          <div className="divide-y divide-sn-border">
            {data!.payment_queue.length === 0 && (
              <p className="px-5 py-4 text-sm text-sn-muted">No pending payments</p>
            )}
            {data!.payment_queue.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sn-gold/10 border border-sn-gold/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={12} className="text-sn-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sn-white truncate">
                    {p.customer?.name} {p.customer?.surname}
                  </p>
                  <p className="text-xs text-sn-muted">{p.payment_method ?? 'method TBD'}</p>
                </div>
                <p className="text-sm font-semibold text-sn-gold">{fmt(p.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
