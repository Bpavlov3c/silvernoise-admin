'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { labels, kvz, type Label } from '@/lib/api'
import { Tag, Search, RefreshCw, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function LabelsPage() {
  const [data, setData] = useState<Label[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [hasCustomers, setHasCustomers] = useState(false)
  const [page, setPage] = useState(1)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (hasCustomers) params.set('has_customers', '1')
    params.set('page', String(page))

    labels
      .list(params.toString())
      .then((res) => { setData(res.data ?? []); setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 }) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, hasCustomers, page])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    kvz.sync()
      .then(res => { setSyncMsg(res.message || 'Sync complete'); fetchData() })
      .catch(e => setSyncMsg('Error: ' + e.message))
      .finally(() => setSyncing(false))
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <Tag size={22} className="text-sn-violet flex-shrink-0" />
            Labels
          </h1>
          <p className="text-sm text-sn-muted mt-1">{meta.total} total</p>
        </div>
        <button onClick={handleSync} disabled={syncing} className="sn-btn-primary flex items-center gap-1.5 flex-shrink-0">
          {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync KVZ'}</span>
          <span className="sm:hidden">{syncing ? '...' : 'Sync'}</span>
        </button>
      </div>

      {syncMsg && (
        <div className={`flex items-center gap-2 mb-4 rounded-lg p-3 text-sm border ${syncMsg.startsWith('Error') ? 'text-sn-red bg-sn-red/10 border-sn-red/20' : 'text-sn-green bg-sn-green/10 border-sn-green/20'}`}>
          <CheckCircle2 size={14} className="flex-shrink-0" /> {syncMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sn-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search labels..."
            className="sn-input pl-9"
          />
        </div>
        <button
          onClick={() => { setHasCustomers(v => !v); setPage(1) }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            hasCustomers
              ? 'bg-sn-cyan/10 border-sn-cyan/40 text-sn-cyan'
              : 'border-sn-border text-sn-muted hover:border-sn-cyan/30 hover:text-sn-white'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${hasCustomers ? 'bg-sn-cyan' : 'bg-sn-muted'}`} />
          With customers only
        </button>
      </div>

      <div className="sn-card overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-sn-cyan" />
          </div>
        )}
        {error && !loading && (
          <div className="flex items-center gap-2 m-4 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-lg p-3 text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-sn-border">
                  <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Label</th>
                  <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden md:table-cell">Customer</th>
                  <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden lg:table-cell">Created</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sn-border">
                {data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-sn-muted">No labels found</td>
                  </tr>
                )}
                {data.map((l) => (
                  <tr key={l.id} className="hover:bg-sn-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-sn-violet/10 border border-sn-violet/20 flex items-center justify-center flex-shrink-0">
                          <Tag size={13} className="text-sn-violet" />
                        </div>
                        <Link href={`/labels/${l.id}`} className="font-medium text-sn-white hover:text-sn-cyan transition-colors truncate">
                          {l.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {l.customers && l.customers.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Link href={`/customers/${l.customers[0].id}`} className="text-xs text-sn-muted hover:text-sn-cyan transition-colors">
                            {l.customers[0].name} {l.customers[0].surname}
                          </Link>
                          {l.customers.length > 1 && (
                            <span className="text-xs text-sn-muted opacity-60">+{l.customers.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-sn-muted">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-sn-muted">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/labels/${l.id}`}
                        className="text-xs text-sn-muted hover:text-sn-cyan transition-colors whitespace-nowrap"
                      >
                        View
                      </Link>
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
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="px-3 py-1.5 rounded border border-sn-border hover:border-sn-cyan/50 disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="px-3 py-1.5 rounded border border-sn-border hover:border-sn-cyan/50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
