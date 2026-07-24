'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Play } from 'lucide-react'
import { apiLogs, kvz, type ApiLog } from '@/lib/api'

const PER_PAGE_OPTIONS = [50, 100, 250, 500]

export default function ApiLogsPage() {
  const [logs, setLogs]       = useState<ApiLog[]>([])
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [error, setError]     = useState('')
  const [page, setPage]       = useState(1)
  const [perPage, setPerPage] = useState(50)

  const fetchLogs = useCallback(() => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    apiLogs
      .list(params.toString())
      .then((res) => {
        setLogs(res.data ?? [])
        setMeta(res.meta ?? { current_page: 1, last_page: 1, per_page: perPage, total: 0 })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, perPage])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  async function triggerSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await kvz.sync()
      setSyncMsg(res.message ?? 'Sync job queued — check logs in a moment.')
      setTimeout(fetchLogs, 3000)
    } catch (e) {
      setSyncMsg(e instanceof Error ? e.message : 'Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  function statusColor(code: number | null) {
    if (!code) return 'text-sn-muted'
    if (code < 300) return 'text-green-400'
    if (code < 500) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold font-display text-sn-white flex items-center gap-2">
          <RefreshCw size={22} className="text-sn-cyan" /> API Logs / KVZ Sync
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="sn-btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="sn-btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Play size={14} className={syncing ? 'animate-pulse' : ''} />
            {syncing ? 'Queuing…' : 'Run KVZ Sync'}
          </button>
        </div>
      </div>

      {/* Feedback banners */}
      {syncMsg && (
        <div className="sn-card p-3 mb-4 text-sm text-sn-cyan border border-sn-cyan/30">
          {syncMsg}
        </div>
      )}
      {error && (
        <div className="sn-card p-3 mb-4 text-sm text-red-400 border border-red-500/30">
          {error}
        </div>
      )}

      {/* Info strip */}
      <div className="sn-card p-4 mb-6 flex flex-wrap items-center gap-6 text-sm">
        <span className="text-sn-muted">Endpoint:</span>
        <code className="text-sn-cyan">https://api.kvzmusic.com/rest/releases</code>
        <span className="text-sn-muted">Auth:</span>
        <code className="text-sn-muted font-mono">X-KVZ-APIKey: &lt;env: KVZ_API_KEY&gt;</code>
        <span className="text-sn-muted">CLI:</span>
        <code className="text-sn-muted font-mono">php artisan kvz:sync</code>
      </div>

      {/* Logs table */}
      <div className="sn-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-sn-muted">
            {meta?.total ?? 0} total log entries
          </span>
          <div className="flex items-center gap-2 text-sm text-sn-muted">
            <span>Per page:</span>
            {PER_PAGE_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => { setPerPage(n); setPage(1) }}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  perPage === n
                    ? 'bg-sn-cyan/20 text-sn-cyan border border-sn-cyan/30'
                    : 'hover:bg-sn-surface text-sn-muted border border-transparent'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-white/5 text-sn-muted text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Endpoint</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Ms</th>
              <th className="px-4 py-3 text-left">Triggered by</th>
              <th className="px-4 py-3 text-left">Error</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sn-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sn-muted">
                  No API logs yet. Make sure <code className="text-sn-cyan">KVZ_API_KEY</code> is set in Forge,
                  then click <strong className="text-sn-white">Run KVZ Sync</strong>.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-sn-muted text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-sn-cyan/10 text-sn-cyan uppercase">
                    {log.source}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-sn-white max-w-[250px] truncate">
                  {log.endpoint}
                </td>
                <td className={`px-4 py-3 font-mono text-xs font-bold ${statusColor(log.status_code)}`}>
                  {log.status_code ?? '—'}
                </td>
                <td className="px-4 py-3 text-sn-muted text-xs">
                  {log.response_time_ms != null ? `${log.response_time_ms}` : '—'}
                </td>
                <td className="px-4 py-3 text-sn-muted text-xs">
                  {log.triggered_by
                    ? `${log.triggered_by.name} ${log.triggered_by.surname}`
                    : 'System'}
                </td>
                <td className="px-4 py-3 text-red-400 text-xs max-w-[200px] truncate" title={log.error_message ?? ''}>
                  {log.error_message ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-sn-muted">
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
