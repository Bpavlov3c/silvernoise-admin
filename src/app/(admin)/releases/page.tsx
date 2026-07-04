'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { releases, type Release } from '@/lib/api'
import { Disc3, Search, Plus, Loader2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

const STATUS_OPTIONS = ['draft', 'pending', 'approved', 'delivered', 'live', 'takedown']

const STATUS_STYLES: Record<string, string> = {
  live:      'bg-sn-green/10 text-sn-green border border-sn-green/20',
  pending:   'bg-sn-gold/10 text-sn-gold border border-sn-gold/20',
  approved:  'bg-sn-cyan/10 text-sn-cyan border border-sn-cyan/20',
  delivered: 'bg-sn-violet/10 text-sn-violet border border-sn-violet/20',
  draft:     'bg-sn-muted/10 text-sn-muted border border-sn-border',
  takedown:  'bg-sn-red/10 text-sn-red border border-sn-red/20',
}

export default function ReleasesPage() {
  const [data, setData] = useState<Release[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    params.set('page', String(page))

    releases
      .list(params.toString())
      .then((res) => { setData(res.data ?? []); setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 }) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, status, page])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <Disc3 size={22} className="text-sn-purple" />
            Releases
          </h1>
          <p className="text-sm text-sn-muted mt-1">{meta.total} total</p>
        </div>
        <Link href="/releases/new" className="sn-btn-primary">
          <Plus size={14} /> Add release
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
            placeholder="Search releases…"
            className="sn-input pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="sn-input w-40"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sn-border">
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Release</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden md:table-cell">Label</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden lg:table-cell">Catalog ID</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden lg:table-cell">Release date</th>
                <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-20 text-xs text-sn-muted font-medium uppercase tracking-wider hidden sm:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sn-border">
              {data.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-sn-muted">No releases found</td></tr>
              )}
              {data.map((r) => (
                <tr key={r.id} className="hover:bg-sn-surface/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.cover_art_url ? (
                        <img src={r.cover_art_url} alt={r.title} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-sn-surface border border-sn-border flex items-center justify-center flex-shrink-0">
                          <Disc3 size={14} className="text-sn-muted" />
                        </div>
                      )}
                      <div>
                        <Link href={`/releases/${r.id}`} className="font-medium text-sn-white hover:text-sn-cyan transition-colors">
                          {r.title}
                        </Link>
                        <p className="text-xs text-sn-muted">{r.customer?.name} {r.customer?.surname}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-sn-muted">{r.label?.name ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-sn-muted">{r.catalog_id ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-sn-muted">
                    {r.original_release_date ? new Date(r.original_release_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect releaseId={r.id} current={r.status} onUpdate={fetchData} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Link href={`/releases/${r.id}`} className="text-xs text-sn-muted hover:text-sn-cyan transition-colors">
                      Edit
                    </Link>
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

function StatusSelect({ releaseId, current, onUpdate }: {
  releaseId: number
  current: string
  onUpdate: () => void
}) {
  const [value, setValue] = useState(current)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: string) {
    setValue(next)
    setSaving(true)
    try {
      await releases.updateStatus(releaseId, next)
      onUpdate()
    } catch {
      setValue(current)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      {saving && <Loader2 size={12} className="absolute left-2 top-1/2 -translate-y-1/2 animate-spin text-sn-cyan z-10" />}
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className={clsx(
          'text-xs rounded-full px-2.5 py-1 border appearance-none cursor-pointer bg-sn-surface focus:outline-none',
          STATUS_STYLES[value] ?? STATUS_STYLES.draft,
          saving && 'pl-6'
        )}
      >
        {STATUS_OPTIONS.map(s => (
          <option key={s} value={s} className="bg-sn-card text-sn-white">{s}</option>
        ))}
      </select>
    </div>
  )
}
