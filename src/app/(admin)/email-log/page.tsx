'use client'

import { useEffect, useState, useCallback } from 'react'
import { emailLog, type EmailLogEntry } from '@/lib/api'
import { Activity, Search, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { clsx } from 'clsx'

export default function EmailLogPage() {
  const [data, setData] = useState<EmailLogEntry[]>([])
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

    emailLog.list(params.toString())
      .then(res => {
        setData(res.data ?? [])
        setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: 50, total: 0 })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, status, page])

  useEffect(() => { fetchData() }, [fetchData])

  function source(entry: EmailLogEntry): string {
    if (entry.campaign_id) return `Campaign #${entry.campaign_id}`
    if (entry.template_key) return entry.template_key
    return '--'
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
            <Activity size={22} className="text-sn-cyan" /> Email Log
          </h1>
          <p className="text-sm text-sn-muted mt-1">{meta.total} emails sent</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sn-muted" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by email..."
            className="sn-input pl-9"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="sn-input w-36"
        >
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-sn-border">
                  <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">To</th>
                  <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden md:table-cell">Subject</th>
                  <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden lg:table-cell">Source</th>
                  <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-sn-muted font-medium uppercase tracking-wider hidden sm:table-cell">Sent at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sn-border">
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-sn-muted">No email logs found</td>
                  </tr>
                )}
                {data.map(entry => (
                  <tr key={entry.id} className="hover:bg-sn-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-sn-white truncate max-w-[180px]">{entry.to_email}</p>
                      {entry.user && (
                        <p className="text-xs text-sn-muted">{entry.user.name} {entry.user.surname}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-sn-muted truncate max-w-[220px]">{entry.subject}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs font-mono text-sn-muted">{source(entry)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {entry.status === 'sent' ? (
                        <span className="flex items-center gap-1 text-xs text-sn-green">
                          <CheckCircle2 size={12} /> Sent
                        </span>
                      ) : (
                        <div>
                          <span className="flex items-center gap-1 text-xs text-sn-red">
                            <XCircle size={12} /> Failed
                          </span>
                          {entry.error_message && (
                            <p className="text-xs text-sn-red/70 mt-0.5 truncate max-w-[160px]" title={entry.error_message}>
                              {entry.error_message}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-sn-muted whitespace-nowrap">
                      {entry.sent_at ? new Date(entry.sent_at).toLocaleString() : '--'}
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
