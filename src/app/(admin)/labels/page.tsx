'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { labels, type Label } from '@/lib/api'
import { Tag, Search, Plus, Loader2, AlertTriangle } from 'lucide-react'

export default function LabelsPage() {
  const [data, setData] = useState<Label[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(page))

    labels
      .list(params.toString())
      .then((res) => { setData(res.data); setMeta(res.meta) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, page])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <Tag size={22} className="text-sn-violet" />
            Labels
          </h1>
          <p className="text-sm text-sn-muted mt-1">{meta.total} total</p>
        </div>
        <Link href="/labels/new" className="sn-btn-primary">
          <Plus size={14} /> Add label
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sn-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search labels…"
            className="sn-input pl-9"
          />
        </div>
      </div>

      <div className="sn-card overflow-hidden">
        {loading && <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-sn-cyan" /></div>}
        {error && !loading && (
          <div className="flex items-center gap-2 m-4 text-sn-red bg-sn-red/10 border border-sn-red/20 rounded-lg p-3 text-sm">
            <AlertTriangle size={14} /> {error}
          </div>
        )}
        {!loading && !error && (
          <table className="w-full text-sm">
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
                <tr><td colSpan={4} className="text-center py-10 text-sn-muted">No labels found</td></tr>
              )}
              {data.map((l) => (
                <tr key={l.id} className="hover:bg-sn-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-sn-violet/10 border border-sn-violet/20 flex items-center justify-center flex-shrink-0">
                        <Tag size={13} className="text-sn-violet" />
                      </div>
                      <Link href={`/labels/${l.id}`} className="font-medium text-sn-white hover:text-sn-cyan transition-colors">
                        {l.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {l.customer ? (
                      <Link href={`/customers/${l.customer.id}`} className="text-xs text-sn-muted hover:text-sn-cyan transition-colors">
                        {l.customer.name} {l.customer.surname}
                      </Link>
                    ) : <span className="text-xs text-sn-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-sn-muted">
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/labels/${l.id}`} className="text-xs text-sn-muted hover:text-sn-cyan transition-colors">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
