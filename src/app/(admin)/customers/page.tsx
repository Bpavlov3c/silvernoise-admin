'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { customers, type Customer } from '@/lib/api'
import {
  Users, Search, Plus, MoreHorizontal,
  CheckCircle2, XCircle, ShieldOff, Loader2, AlertTriangle, Star,
} from 'lucide-react'
import { clsx } from 'clsx'

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [actionId, setActionId] = useState<number | null>(null)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    params.set('page', String(page))

    customers
      .list(params.toString())
      .then((res) => {
        setData(res.data ?? [])
        setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, status, page])

  useEffect(() => {
    fetch()
  }, [fetch])

  async function doAction(
    id: number,
    action: () => Promise<unknown>,
  ) {
    setActionId(id)
    try {
      await action()
      fetch()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <Users size={22} className="text-sn-cyan" />
            Customers
          </h1>
          <p className="text-sm text-sn-muted mt-1">{meta.total} total</p>
        </div>
        <Link href="/customers/new" className="sn-btn-primary">
          <Plus size={14} />
          Add customer
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sn-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, email, company…"
            className="sn-input pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="sn-input w-36"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="sn-card overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-sn-cyan" />
          </div>
        )}
        {error && !loading && (
          <div className="flex items-center gap-2 m-4 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-lg p-3 text-sm">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-sn-border">
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden md:table-cell">Labels</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sn-border">
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sn-muted">No customers found</td>
                </tr>
              )}
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-sn-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sn-cyan/20 to-sn-purple/20 border border-sn-border flex items-center justify-center text-xs font-semibold text-sn-white flex-shrink-0">
                        {c.name[0]}{c.surname[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <Link href={`/customers/${c.id}`} className="font-medium text-sn-white hover:text-sn-cyan transition-colors">
                            {c.name} {c.surname}
                          </Link>
                          {c.featured && <Star size={11} className="text-sn-gold fill-sn-gold" />}
                        </div>
                        <p className="text-xs text-sn-muted">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-sn-muted capitalize">
                      {c.customer_type ?? '—'}
                      {c.company_name && ` · ${c.company_name}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-sn-muted">
                    {c.labels?.length ?? 0} label{c.labels?.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3">
                    {c.is_blocked ? (
                      <span className="status-badge bg-sn-red/10 text-sn-red border border-sn-red/20">Blocked</span>
                    ) : c.is_active ? (
                      <span className="status-badge bg-sn-green/10 text-sn-green border border-sn-green/20">Active</span>
                    ) : (
                      <span className="status-badge bg-sn-muted/10 text-sn-muted border border-sn-border">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu
                      customer={c}
                      loading={actionId === c.id}
                      onActivate={() => doAction(c.id, () => customers.activate(c.id))}
                      onDeactivate={() => doAction(c.id, () => customers.deactivate(c.id))}
                      onBlock={() => doAction(c.id, () => customers.block(c.id))}
                      onResetPw={() => doAction(c.id, () => customers.resetPassword(c.id))}
                      onToggleFeatured={() => doAction(c.id, () => customers.toggleFeatured(c.id))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-sn-border flex items-center justify-between text-xs text-sn-muted">
            <span>Page {meta.current_page} of {meta.last_page}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={meta.current_page === 1}
                className="sn-btn-ghost text-xs py-1 px-3 disabled:opacity-30"
              >Prev</button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={meta.current_page === meta.last_page}
                className="sn-btn-ghost text-xs py-1 px-3 disabled:opacity-30"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionMenu({
  customer,
  loading,
  onActivate,
  onDeactivate,
  onBlock,
  onResetPw,
  onToggleFeatured,
}: {
  customer: Customer
  loading: boolean
  onActivate: () => void
  onDeactivate: () => void
  onBlock: () => void
  onResetPw: () => void
  onToggleFeatured: () => void
}) {
  const [open, setOpen] = useState(false)

  if (loading) return <Loader2 size={14} className="animate-spin text-sn-cyan" />

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 text-sn-muted hover:text-sn-white rounded transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 sn-card shadow-xl z-20 py-1 text-sm">
            <Link
              href={`/customers/${customer.id}`}
              className="flex items-center gap-2 px-3 py-1.5 text-sn-muted hover:text-sn-white hover:bg-sn-surface transition-colors"
              onClick={() => setOpen(false)}
            >
              View details
            </Link>
            {!customer.is_active && !customer.is_blocked && (
              <button onClick={() => { onActivate(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sn-green hover:bg-sn-green/5 transition-colors">
                <CheckCircle2 size={13} /> Activate
              </button>
            )}
            {customer.is_active && (
              <button onClick={() => { onDeactivate(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sn-orange hover:bg-sn-orange/5 transition-colors">
                <XCircle size={13} /> Deactivate
              </button>
            )}
            {!customer.is_blocked && (
              <button onClick={() => { onBlock(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sn-red hover:bg-sn-red/5 transition-colors">
                <ShieldOff size={13} /> Block
              </button>
            )}
            <div className="border-t border-sn-border my-1" />
            <button onClick={() => { onResetPw(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sn-muted hover:text-sn-white hover:bg-sn-surface transition-colors">
              Reset password
            </button>
            <button onClick={() => { onToggleFeatured(); setOpen(false) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sn-muted hover:text-sn-gold hover:bg-sn-gold/5 transition-colors">
              <Star size={13} /> {customer.featured ?'Unfeature' : 'Feature'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
