'use client'

import { useEffect, useState, useCallback } from 'react'
import { payments, type PaymentRequest } from '@/lib/api'
import { CreditCard, Loader2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

function fmt(n: number, currency = 'EUR') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(n)
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'bg-sn-gold/10 text-sn-gold border border-sn-gold/20',
  processing: 'bg-sn-cyan/10 text-sn-cyan border border-sn-cyan/20',
  sent:       'bg-sn-green/10 text-sn-green border border-sn-green/20',
  completed:  'bg-sn-green/10 text-sn-green border border-sn-green/20',
  rejected:   'bg-sn-red/10 text-sn-red border border-sn-red/20',
}

const STATUS_OPTIONS = ['pending', 'processing', 'sent', 'completed', 'rejected']

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentRequest[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))

    payments
      .list(params.toString())
      .then((res) => { setData(res.data ?? []); setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 }) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [statusFilter, page])

  useEffect(() => { fetchData() }, [fetchData])

  async function changeStatus(id: number, status: string) {
    setUpdatingId(id)
    try {
      await payments.updateStatus(id, status)
      fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <CreditCard size={22} className="text-sn-green" />
            Payments
          </h1>
          <p className="text-sm text-sn-muted mt-1">{meta.total} total</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="sn-input w-40"
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="sn-card overflow-hidden">
        {loading && <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-sn-cyan" /></div>}
        {error && !loading && (
          <div className="flex items-center gap-2 m-4 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-lg p-3 text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-sn-border">
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden md:table-cell">Periods</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden lg:table-cell">Requested</th>
                <th className="text-right px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider w-44">Set status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sn-border">
              {data.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-sn-muted">No payments found</td></tr>
              )}
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-sn-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sn-white">{p.customer?.name} {p.customer?.surname}</p>
                    <p className="text-xs text-sn-muted">{p.customer?.email}</p>
                    {p.iban && <p className="text-[11px] text-sn-muted font-mono mt-0.5">{p.iban}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-sn-muted">
                    {p.periods && p.periods.length > 0
                      ? p.periods.map((pd) => pd.period_label).join(', ')
                      : (p.report?.report_period ?? '—')}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-sn-muted">
                    {new Date(p.requested_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-sn-gold tabular-nums">{fmt(p.amount, p.currency)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs rounded-full px-2.5 py-0.5 border font-medium capitalize',
                      STATUS_STYLES[p.status] ?? 'bg-sn-muted/10 text-sn-muted border-sn-border')}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {updatingId === p.id ? (
                      <Loader2 size={14} className="animate-spin text-sn-cyan" />
                    ) : (
                      <select
                        value={p.status}
                        onChange={(e) => changeStatus(p.id, e.target.value)}
                        className="sn-input text-xs py-1 capitalize w-40"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-sn-border flex items-center justify-between text-xs text-sn-muted">
            <span>Page {meta.current_page} of {meta.last_page}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={meta.current_page === 1} className="sn-btn-ghost text-xs py-1 px-3 disabled:opacity-30">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={meta.current_page === meta.last_page} className="sn-btn-ghost text-xs py-1 px-3 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
